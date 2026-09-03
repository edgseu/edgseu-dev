import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { load } from 'cheerio';
import { site } from '../src/data/site';
const dist = resolve(process.env.DIST_DIR ?? 'dist');
const errors: string[] = [];
const canonicalUrls = new Map<string, string>();
const pageTitles = new Map<string, string>();
const pageDescriptions = new Map<string, string>();

function fail(page: string, message: string): void {
  errors.push(`${page}: ${message}`);
}

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function routeFor(file: string): string {
  const path = relative(dist, file).replaceAll('\\', '/');
  return path === 'index.html' ? '/' : `/${path.replace(/index\.html$/u, '')}`;
}

function localAsset(url: string): string | undefined {
  if (!url.startsWith('/') || url.startsWith('//')) return undefined;
  const path = decodeURIComponent(url.split(/[?#]/u)[0] ?? '/');
  const direct = join(dist, path);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;
  const index = join(dist, path, 'index.html');
  return existsSync(index) ? index : undefined;
}

if (!existsSync(dist)) {
  console.error(`Built artifact not found: ${dist}`);
  process.exit(1);
}

const files = walk(dist);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const route = routeFor(file);
  const html = readFileSync(file, 'utf8');
  const $ = load(html);
  const noindex = $('meta[name="robots"]').attr('content')?.includes('noindex') ?? false;
  const isRedirect = $('meta[http-equiv="refresh"]').length > 0;
  const title = $('title').text().trim();
  const description = $('meta[name="description"]').attr('content')?.trim() ?? '';
  const canonical = $('link[rel="canonical"]').attr('href') ?? '';

  if (!title) fail(route, 'missing title');
  if (!canonical.startsWith(`${site.canonicalUrl}/`)) fail(route, `invalid canonical: ${canonical || 'missing'}`);
  if (!isRedirect) {
    if (!description) fail(route, 'missing description');
    if ($('h1').length !== 1) fail(route, `expected exactly one H1, found ${$('h1').length}`);
    if (!$('meta[property="og:title"]').attr('content') || !$('meta[property="og:image"]').attr('content')) fail(route, 'missing Open Graph metadata');
    if (!$('meta[name="twitter:card"]').attr('content')) fail(route, 'missing Twitter share metadata');
  }
  if (!noindex && canonical) {
    const priorCanonical = canonicalUrls.get(canonical);
    if (priorCanonical) fail(route, `duplicate canonical also used by ${priorCanonical}`);
    canonicalUrls.set(canonical, route);
  }
  if (!noindex && title) {
    const priorTitle = pageTitles.get(title);
    if (priorTitle) fail(route, `duplicate title also used by ${priorTitle}`);
    pageTitles.set(title, route);
  }
  if (!noindex && description) {
    const priorDescription = pageDescriptions.get(description);
    if (priorDescription) fail(route, `duplicate description also used by ${priorDescription}`);
    pageDescriptions.set(description, route);
  }

  for (const element of $('a[href]').toArray()) {
    const href = $(element).attr('href') ?? '';
    if (/^(?:https?:|mailto:|#)/u.test(href)) continue;
    if (!localAsset(href)) fail(route, `broken internal link: ${href}`);
  }

  const resourceUrls = new Set<string>();
  $('script[src], link[rel="stylesheet"][href], img[src]:not([loading="lazy"])').each((_, element) => {
    const value = $(element).attr('src') ?? $(element).attr('href');
    if (value?.startsWith('/')) resourceUrls.add(value);
  });
  let jsBytes = 0;
  let cssBytes = 0;
  let fontBytes = 0;
  let transferBytes = gzipSync(html).byteLength;
  for (const url of resourceUrls) {
    const asset = localAsset(url);
    if (!asset) {
      fail(route, `missing first-party resource: ${url}`);
      continue;
    }
    const bytes = readFileSync(asset);
    const gzipBytes = gzipSync(bytes).byteLength;
    transferBytes += gzipBytes;
    const extension = extname(asset).toLocaleLowerCase();
    if (extension === '.js') jsBytes += gzipBytes;
    if (extension === '.css') cssBytes += gzipBytes;
    if (['.woff', '.woff2', '.ttf', '.otf'].includes(extension)) fontBytes += gzipBytes;
  }
  $('img[src]').each((_, element) => {
    const value = $(element).attr('src');
    if (!value?.startsWith('/')) return;
    // Responsive images list every generated breakpoint candidate in srcset;
    // each one must exist in the artifact and honor the per-image budget.
    const candidates = new Set<string>([value]);
    for (const entry of ($(element).attr('srcset') ?? '').split(',')) {
      const candidate = entry.trim().split(/\s+/u)[0];
      if (candidate) candidates.add(candidate);
    }
    for (const candidate of candidates) {
      if (!candidate.startsWith('/')) continue;
      const asset = localAsset(candidate);
      if (!asset) {
        fail(route, `missing image asset: ${candidate}`);
        continue;
      }
      const bytes = readFileSync(asset);
      if (bytes.byteLength > 200 * 1024) {
        fail(route, `image exceeds 200 KiB: ${candidate}`);
      }
    }
  });
  if (jsBytes > 40 * 1024) fail(route, `JavaScript budget exceeded: ${jsBytes} gzip bytes`);
  if (cssBytes > 50 * 1024) fail(route, `CSS budget exceeded: ${cssBytes} gzip bytes`);
  if (fontBytes > 100 * 1024) fail(route, `font budget exceeded: ${fontBytes} gzip bytes`);
  if (transferBytes > 500 * 1024) fail(route, `initial transfer budget exceeded: ${transferBytes} gzip bytes`);
  if (resourceUrls.size > 20) fail(route, `initial request budget exceeded: ${resourceUrls.size} first-party resources`);
}

const sitemapFile = join(dist, 'sitemap.xml');
if (!existsSync(sitemapFile)) fail('/sitemap.xml', 'sitemap is missing');
else {
  const sitemap = readFileSync(sitemapFile, 'utf8');
  for (const [canonical, route] of canonicalUrls) {
    if (route !== '/sitemap.xml' && !sitemap.includes(`<loc>${canonical}</loc>`)) {
      fail(route, 'canonical route is missing from sitemap');
    }
  }
}
const robotsFile = join(dist, 'robots.txt');
if (!existsSync(robotsFile) || !readFileSync(robotsFile, 'utf8').includes(`Sitemap: ${site.canonicalUrl}/sitemap.xml`)) {
  fail('/robots.txt', 'robots policy or canonical sitemap declaration is missing');
}

if (errors.length > 0) {
  console.error(`Artifact quality gate failed with ${errors.length} error${errors.length === 1 ? '' : 's'}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Artifact quality gate passed: ${htmlFiles.length} HTML routes checked.`);
}

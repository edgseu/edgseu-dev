import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import matter from 'gray-matter';
import { slug } from 'github-slugger';
import type { Code, Heading, Image, Link, Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { projects } from '../src/data/projects';

interface ParsedArticle {
  slug: string;
  file: string;
  state: 'Draft' | 'Published';
  aliases: string[];
  links: string[];
  pinned?: boolean;
}

const errors: string[] = [];
const articleRoot = resolve(process.env.ARTICLE_ROOT ?? 'src/content/articles');
const allowedLanguages: Record<string, true> = {
  bash: true, css: true, diff: true, dockerfile: true, go: true, hcl: true,
  html: true, javascript: true, json: true, jsx: true, kotlin: true,
  markdown: true, plaintext: true, python: true, rust: true, shell: true,
  sql: true, text: true, toml: true, tsx: true, typescript: true, xml: true,
  yaml: true, yml: true,
};

function fail(location: string, message: string): void {
  errors.push(`${location}: ${message}`);
}

function validateProjects(): void {
  const ids = new Set<string>();
  const orders = new Set<number>();
  for (const project of projects) {
    const location = `project ${project.id}`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(project.id)) fail(location, 'ID must be lowercase kebab-case');
    if (ids.has(project.id)) fail(location, 'ID must be unique');
    ids.add(project.id);
    if (!project.title.trim()) fail(location, 'title is required');
    if (!project.summary.trim() || project.summary.length > 240 || /[\n\r<>]/u.test(project.summary)) {
      fail(location, 'summary must be plain text between 1 and 240 characters');
    }
    if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/u.test(project.url)) {
      fail(location, 'Published destination must be a canonical GitHub repository URL');
    }
    if (!Number.isInteger(project.order) || orders.has(project.order)) fail(location, 'display order must be a unique integer');
    orders.add(project.order);
    if (project.tags.length < 1 || project.tags.length > 6) fail(location, 'requires one to six tags');
    const tags = project.tags.map((tag) => tag.toLocaleLowerCase());
    if (new Set(tags).size !== tags.length) fail(location, 'tags must be unique ignoring case');
    if (project.pinned !== undefined && typeof project.pinned !== 'boolean') {
      fail(location, 'pinned must be a boolean');
    }
  }
  const pinnedProjects = projects.filter((project) => project.state === 'Published' && project.pinned);
  if (pinnedProjects.length > 4) {
    fail('projects', 'no more than 4 Published projects may be pinned');
  }
  const publishedOrder = projects.filter((project) => project.state === 'Published').toSorted((a, b) => a.order - b.order);
  if (publishedOrder[0]?.id !== 'devsecops-pipeline-project' || publishedOrder[1]?.id !== 'cowrie-sentinel-lab') {
    fail('projects', 'approved Projects must remain in the fixed display order');
  }
}

function parseArticle(directory: string): ParsedArticle | undefined {
  const slugName = basename(directory);
  const file = join(directory, 'index.md');
  if (!existsSync(file)) {
    fail(directory, 'Article folder must contain index.md');
    return undefined;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slugName)) fail(file, 'folder slug must be lowercase kebab-case');
  const source = readFileSync(file, 'utf8');
  const parsed = matter(source);
  const data = parsed.data as Record<string, unknown>;
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const summary = typeof data.summary === 'string' ? data.summary.trim() : '';
  const state = data.state;
  if (!title || /[#<>\n\r]/u.test(title)) fail(file, 'title is required and must be plain text');
  if (!summary || /[#<>\n\r]/u.test(summary)) fail(file, 'summary is required and must be plain text');
  if (state !== 'Draft' && state !== 'Published') fail(file, 'state must be Draft or Published');

  const publishedAt = normalizeDate(data.publishedAt);
  const revisedAt = normalizeDate(data.revisedAt);
  if (state === 'Published' && !publishedAt) fail(file, 'Published Articles require publishedAt in YYYY-MM-DD form');
  if (state === 'Draft' && publishedAt) fail(file, 'Draft Articles must not declare publishedAt');
  if (publishedAt && publishedAt > new Date().toISOString().slice(0, 10)) fail(file, 'publishedAt cannot be in the future');
  if (revisedAt && (!publishedAt || revisedAt < publishedAt)) fail(file, 'revisedAt must be on or after publishedAt');
  if (data.pinned !== undefined && typeof data.pinned !== 'boolean') {
    fail(file, 'pinned must be a boolean');
  }
  const tags = Array.isArray(data.tags) ? data.tags : [];
  if (tags.length > 4 || tags.some((tag) => typeof tag !== 'string' || !tag.trim())) fail(file, 'tags must contain zero to four nonempty strings');
  const normalizedTags = tags.map((tag) => String(tag).toLocaleLowerCase());
  if (new Set(normalizedTags).size !== normalizedTags.length) fail(file, 'tags must be unique ignoring case');

  const aliases = Array.isArray(data.aliases) ? data.aliases.map(String) : [];
  for (const alias of aliases) {
    if (!/^\/articles\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/u.test(alias)) fail(file, `invalid Article alias: ${alias}`);
  }

  const tree = unified().use(remarkParse).use(remarkGfm).parse(parsed.content) as Root;
  let priorDepth = 1;
  const anchors = new Set<string>();
  const links: string[] = [];

  visit(tree, 'html', () => fail(file, 'raw HTML is not portable and is not allowed'));
  visit(tree, 'heading', (node: Heading) => {
    if (node.depth === 1) fail(file, 'frontmatter title is the only allowed H1');
    if (node.depth > 4) fail(file, 'body headings are limited to H2 through H4');
    if (node.depth > priorDepth + 1) fail(file, `heading level skips from H${priorDepth} to H${node.depth}`);
    priorDepth = node.depth;
    if (node.depth === 2 || node.depth === 3) {
      const anchor = slug(toString(node));
      if (anchors.has(anchor)) fail(file, `duplicate normalized H2/H3 anchor: ${anchor}`);
      anchors.add(anchor);
    }
  });
  visit(tree, 'code', (node: Code) => {
    if (!node.lang || !allowedLanguages[node.lang.toLocaleLowerCase()]) {
      fail(file, `code fence requires a recognized language, text, or diff (received ${node.lang ?? 'none'})`);
    }
    if (node.meta && !/^"[^"\n]+"$/u.test(node.meta)) fail(file, 'code fence metadata may contain only one quoted title');
  });
  visit(tree, 'image', (node: Image) => {
    if (node.alt === null || node.alt === undefined) fail(file, `image requires descriptive alt text or explicit empty alt: ${node.url}`);
    validateLocalTarget(file, node.url, true);
  });
  visit(tree, 'link', (node: Link) => {
    links.push(node.url);
    validateLocalTarget(file, node.url, false);
  });

  return {
    slug: slugName,
    file,
    state: state === 'Draft' ? 'Draft' : 'Published',
    aliases,
    links,
    pinned: data.pinned === true,
  };
}

function normalizeDate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(value)) return value;
  return undefined;
}

function validateLocalTarget(file: string, target: string, image: boolean): void {
  if (/^(?:https?:|mailto:|#)/u.test(target)) return;
  if (target.startsWith('/')) {
    const allowedRoute = target === '/' || target.startsWith('/articles/') || target === '/projects/';
    if (!allowedRoute) fail(file, `unknown internal route: ${target}`);
    return;
  }
  const path = resolve(dirname(file), decodeURIComponent(target.split('#')[0] ?? ''));
  if (!existsSync(path)) fail(file, `broken local ${image ? 'asset' : 'link'}: ${target}`);
  if (image && !['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(extname(path).toLocaleLowerCase())) {
    fail(file, `unsupported committed image format: ${target}`);
  }
}

validateProjects();
if (!existsSync(articleRoot)) fail(articleRoot, 'Article root does not exist');
const entries = existsSync(articleRoot) ? readdirSync(articleRoot, { withFileTypes: true }) : [];
for (const entry of entries) {
  if (entry.isFile() && entry.name.endsWith('.mdx')) fail(join(articleRoot, entry.name), 'MDX is not allowlisted');
}
const articles = entries.filter((entry) => entry.isDirectory()).map((entry) => parseArticle(join(articleRoot, entry.name))).filter((article): article is ParsedArticle => Boolean(article));
const slugs = new Set<string>();
const routes = new Map<string, ParsedArticle>();
for (const article of articles) {
  if (slugs.has(article.slug)) fail(article.file, 'Article slug must be unique');
  slugs.add(article.slug);
  routes.set(`/articles/${article.slug}/`, article);
  for (const alias of article.aliases) {
    if (routes.has(alias)) fail(article.file, `alias collides with another Article route: ${alias}`);
    routes.set(alias, article);
  }
}
for (const article of articles.filter((candidate) => candidate.state === 'Published')) {
  for (const link of article.links) {
    const target = routes.get(link.split('#')[0] ?? '');
    if (target?.state === 'Draft') fail(article.file, `Published Article links to Draft Article: ${link}`);
  }
}
const pinnedPublishedArticles = articles.filter((article) => article.state === 'Published' && article.pinned);
if (pinnedPublishedArticles.length > 2) {
  fail('articles', 'no more than 2 Published articles may be pinned');
}

if (errors.length > 0) {
  console.error(`Content validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Content validation passed: ${projects.length} Projects, ${articles.length} Articles.`);
}

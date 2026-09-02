import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import type { MarkdownInstance } from 'astro';
import matter from 'gray-matter';
import { slug } from 'github-slugger';
import type { Code, Heading, Image, Link, Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

const markdownProcessor = unified().use(remarkParse).use(remarkGfm);
export interface ArticleFrontmatter {
  title: string;
  summary: string;
  state: 'Draft' | 'Published';
  publishedAt?: string;
  revisedAt?: string;
  tags?: string[];
  aliases?: string[];
  pinned?: boolean;
}

export interface ArticleOutlineNode {
  depth: number;
  slug: string;
  text: string;
}

export interface ParsedArticle {
  slug: string;
  file?: string;
  title: string;
  summary: string;
  state: 'Draft' | 'Published';
  publishedAt?: string;
  revisedAt?: string;
  tags?: string[];
  aliases?: string[];
  links: string[];
  outline?: ArticleOutlineNode[];
  pinned?: boolean;
  readingMinutes: number;
}

export interface ArticleValidationResult {
  valid: boolean;
  article?: ParsedArticle;
  errors: string[];
}

export interface Article {
  slug: string;
  path: `/articles/${string}/`;
  frontmatter: ArticleFrontmatter;
  Content: MarkdownInstance<ArticleFrontmatter>['Content'];
  headings: MarkdownInstance<ArticleFrontmatter>['getHeadings'] extends () => infer T ? T : never;
  outline: ArticleOutlineNode[];
  readingMinutes: number;
}

export function extractArticleOutline(
  headings: readonly { depth: number; slug: string; text: string }[],
): ArticleOutlineNode[] {
  return headings
    .filter((heading) => heading.depth === 2 || heading.depth === 3)
    .map((heading) => ({
      depth: heading.depth,
      slug: heading.slug,
      text: heading.text,
    }));
}
export const allowedCodeLanguages: Record<string, true> = {
  bash: true,
  css: true,
  diff: true,
  dockerfile: true,
  go: true,
  hcl: true,
  html: true,
  javascript: true,
  json: true,
  jsx: true,
  kotlin: true,
  markdown: true,
  plaintext: true,
  python: true,
  rust: true,
  shell: true,
  sql: true,
  text: true,
  toml: true,
  tsx: true,
  typescript: true,
  xml: true,
  yaml: true,
  yml: true,
};

export function normalizeDate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(trimmed);
  if (!match || !match[1] || !match[2] || !match[3]) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maxDays = daysInMonth[month - 1];
  if (maxDays === undefined || day > maxDays) return undefined;
  return trimmed;
}

export function calculateReadingMinutes(content: string): number {
  let words = 0;
  const re = /\S+/gu;
  while (re.exec(content) !== null) {
    words++;
  }
  return Math.max(1, Math.ceil(words / 220));
}

function validateLocalTarget(
  target: string,
  isImage: boolean,
  baseDirectory?: string,
): string | undefined {
  if (/^(?:https?:|mailto:|#)/u.test(target)) return undefined;
  if (target.startsWith('/')) {
    const allowedRoute =
      target === '/' || target.startsWith('/articles/') || target === '/projects/';
    if (!allowedRoute) return `unknown internal route: ${target}`;
    return undefined;
  }
  if (!baseDirectory) return undefined;
  const path = resolve(baseDirectory, decodeURIComponent(target.split('#')[0] ?? ''));
  if (!existsSync(path)) {
    return `broken local ${isImage ? 'asset' : 'link'}: ${target}`;
  }
  if (
    isImage &&
    !['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(extname(path).toLocaleLowerCase())
  ) {
    return `unsupported committed image format: ${target}`;
  }
  return undefined;
}
export interface ParseArticleOptions {
  slug?: string;
  file?: string;
  baseDirectory?: string;
  currentDate?: string;
}

export interface ArticleSource {
  frontmatter: Record<string, unknown>;
  content: string;
}

const articleValidationCache = new Map<string, { mtime: number; result: ArticleValidationResult }>();

export function parseAndValidateArticle(
  source: string | ArticleSource,
  options: ParseArticleOptions = {},
): ArticleValidationResult {
  const fileKey = options.file ?? (typeof source === 'string' && options.slug ? options.slug : undefined);
  let mtime = 0;
  if (fileKey && typeof source === 'string') {
    try {
      mtime = statSync(fileKey).mtimeMs;
      const cached = articleValidationCache.get(fileKey);
      if (cached && cached.mtime === mtime) {
        return cached.result;
      }
    } catch {}
  }

  const errors: string[] = [];
  const fileLabel = options.file ?? 'Article';
  const fail = (message: string) => {
    errors.push(message);
  };

  const structuredSource = typeof source !== 'string';
  let data: Record<string, unknown>;
  let content: string;
  if (typeof source === 'string') {
    const yamlPath = options.baseDirectory ? resolve(options.baseDirectory, 'metadata.yaml') : undefined;
    const ymlPath = options.baseDirectory ? resolve(options.baseDirectory, 'metadata.yml') : undefined;
    if (yamlPath && existsSync(yamlPath)) {
      try {
        const raw = readFileSync(yamlPath, 'utf8');
        const wrapped = raw.startsWith('---') ? raw : `---\n${raw}\n---`;
        data = (matter(wrapped).data as Record<string, unknown>) ?? {};
        content = source;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          valid: false,
          errors: [`${yamlPath}: metadata YAML could not be parsed: ${message}`],
        };
      }
    } else if (ymlPath && existsSync(ymlPath)) {
      try {
        const raw = readFileSync(ymlPath, 'utf8');
        const wrapped = raw.startsWith('---') ? raw : `---\n${raw}\n---`;
        data = (matter(wrapped).data as Record<string, unknown>) ?? {};
        content = source;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          valid: false,
          errors: [`${ymlPath}: metadata YAML could not be parsed: ${message}`],
        };
      }
    } else {
      try {
        const parsed = matter(source);
        data = parsed.data as Record<string, unknown>;
        content = parsed.content;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const formatted = `frontmatter could not be parsed: ${message}`;
        return {
          valid: false,
          errors: [options.file ? `${fileLabel}: ${formatted}` : formatted],
        };
      }
    }
  } else {
    data = source.frontmatter;
    content = source.content;
  }

  const slugName = options.slug ?? '';
  if (slugName && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slugName)) {
    fail('folder slug must be lowercase kebab-case');
  }

  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const summary = typeof data.summary === 'string' ? data.summary.trim() : '';
  const state = data.state;

  if (!title || /[#<>\n\r]/u.test(title)) {
    fail('title is required and must be plain text');
  }
  if (!summary || /[#<>\n\r]/u.test(summary)) {
    fail('summary is required and must be plain text');
  }
  if (state !== 'Draft' && state !== 'Published') {
    fail('state must be Draft or Published');
  }

  const publishedAtDeclared = Object.hasOwn(data, 'publishedAt');
  const revisedAtDeclared = Object.hasOwn(data, 'revisedAt');
  const normalizeSourceDate = (value: unknown): string | undefined => {
    const normalized = normalizeDate(value);
    if (normalized || !structuredSource || typeof value !== 'string') return normalized;
    const astroDate = /^(\d{4}-\d{2}-\d{2})T00:00:00\.000Z$/u.exec(value);
    return astroDate ? normalizeDate(astroDate[1]) : undefined;
  };
  const publishedAt = normalizeSourceDate(data.publishedAt);
  const revisedAt = normalizeSourceDate(data.revisedAt);
  const maxDate = options.currentDate ?? new Date().toISOString().slice(0, 10);

  if (state === 'Draft' && publishedAtDeclared) {
    fail('Draft Articles must not declare publishedAt');
  } else if (publishedAtDeclared && !publishedAt) {
    fail('publishedAt must use a valid YYYY-MM-DD calendar date');
  } else if (state === 'Published' && !publishedAt) {
    fail('Published Articles require publishedAt in YYYY-MM-DD form');
  }
  if (state === 'Draft' && revisedAtDeclared) {
    fail('Draft Articles must not declare revisedAt');
  } else if (revisedAtDeclared && !revisedAt) {
    fail('revisedAt must use a valid YYYY-MM-DD calendar date');
  }
  if (publishedAt && publishedAt > maxDate) {
    fail('publishedAt cannot be in the future');
  }
  if (revisedAt && (!publishedAt || revisedAt < publishedAt)) {
    fail('revisedAt must be on or after publishedAt');
  }
  if (data.pinned !== undefined && typeof data.pinned !== 'boolean') {
    fail('pinned must be a boolean');
  }

  let tags: string[] = [];
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      fail('tags must be an array of zero to four nonempty strings');
    } else if (
      data.tags.length > 4 ||
      data.tags.some((tag) => typeof tag !== 'string' || !tag.trim())
    ) {
      fail('tags must contain zero to four nonempty strings');
    } else {
      tags = data.tags.map((tag) => tag.trim());
      const normalizedTags = tags.map((tag) => tag.toLocaleLowerCase());
      if (new Set(normalizedTags).size !== normalizedTags.length) {
        fail('tags must be unique ignoring case');
      }
    }
  }

  let aliases: string[] = [];
  if (data.aliases !== undefined) {
    if (!Array.isArray(data.aliases)) {
      fail('aliases must be an array of Article routes');
    } else if (data.aliases.some((alias) => typeof alias !== 'string')) {
      fail('aliases must contain only Article routes');
    } else {
      aliases = data.aliases;
      for (const alias of aliases) {
        if (!/^\/articles\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/u.test(alias)) {
          fail(`invalid Article alias: ${alias}`);
        }
      }
    }
  }

  const baseDir = options.baseDirectory ?? (options.file ? dirname(options.file) : undefined);
  const tree = markdownProcessor.parse(content) as Root;
  let priorDepth = 1;
  const anchors = new Set<string>();
  const links: string[] = [];
  const outline: ArticleOutlineNode[] = [];

  visit(tree, 'html', () => fail('raw HTML is not portable and is not allowed'));
  visit(tree, 'heading', (node: Heading) => {
    if (node.depth === 1) fail('frontmatter title is the only allowed H1');
    if (node.depth > 4) fail('body headings are limited to H2 through H4');
    if (node.depth > priorDepth + 1) {
      fail(`heading level skips from H${priorDepth} to H${node.depth}`);
    }
    priorDepth = node.depth;
    if (node.depth === 2 || node.depth === 3) {
      const headingText = toString(node);
      const anchor = slug(headingText);
      if (anchors.has(anchor)) fail(`duplicate normalized H2/H3 anchor: ${anchor}`);
      anchors.add(anchor);
      outline.push({
        depth: node.depth,
        slug: anchor,
        text: headingText,
      });
    }
  });

  visit(tree, 'code', (node: Code) => {
    if (!node.lang || !allowedCodeLanguages[node.lang.toLocaleLowerCase()]) {
      fail(
        `code fence requires a recognized language, text, or diff (received ${node.lang ?? 'none'})`,
      );
    }
    if (node.meta && !/^"[^"\n]+"$/u.test(node.meta)) {
      fail('code fence metadata may contain only one quoted title');
    }
  });

  visit(tree, 'image', (node: Image) => {
    if (node.alt === null || node.alt === undefined) {
      fail(`image requires descriptive alt text or explicit empty alt: ${node.url}`);
    }
    const error = validateLocalTarget(node.url, true, baseDir);
    if (error) fail(error);
  });

  visit(tree, 'link', (node: Link) => {
    links.push(node.url);
    const error = validateLocalTarget(node.url, false, baseDir);
    if (error) fail(error);
  });

  const parsedArticle: ParsedArticle = {
    slug: slugName,
    ...(options.file ? { file: options.file } : {}),
    title,
    summary,
    state: state === 'Draft' ? 'Draft' : 'Published',
    ...(publishedAt ? { publishedAt } : {}),
    ...(revisedAt ? { revisedAt } : {}),
    ...(tags.length > 0 ? { tags } : {}),
    ...(aliases.length > 0 ? { aliases } : {}),
    links,
    outline,
    ...(typeof data.pinned === 'boolean' ? { pinned: data.pinned } : {}),
    readingMinutes: calculateReadingMinutes(content),
  };

  const validationResult: ArticleValidationResult = {
    valid: errors.length === 0,
    ...(errors.length === 0 ? { article: parsedArticle } : {}),
    errors: errors.map((error) => (options.file ? `${fileLabel}: ${error}` : error)),
  };
  if (fileKey && mtime > 0) {
    articleValidationCache.set(fileKey, { mtime, result: validationResult });
  }
  return validationResult;
}

export function validateArticleCollection(articles: readonly ParsedArticle[]): string[] {
  const errors: string[] = [];
  const slugs = new Set<string>();
  const routes = new Map<string, ParsedArticle>();

  for (const article of articles) {
    const fileLabel = article.file ?? article.slug;
    if (slugs.has(article.slug)) {
      errors.push(`${fileLabel}: Article slug must be unique`);
    }
    slugs.add(article.slug);
    routes.set(`/articles/${article.slug}/`, article);
  }

  for (const article of articles) {
    const fileLabel = article.file ?? article.slug;
    for (const alias of article.aliases ?? []) {
      if (routes.has(alias)) {
        errors.push(`${fileLabel}: alias collides with another Article route: ${alias}`);
      } else {
        routes.set(alias, article);
      }
    }
  }

  let pinnedCount = 0;
  for (const article of articles) {
    const fileLabel = article.file ?? article.slug;
    if (article.state === 'Published') {
      if (article.pinned) pinnedCount++;
      for (const link of article.links) {
        const target = routes.get(link.split('#')[0] ?? '');
        if (target?.state === 'Draft') {
          errors.push(`${fileLabel}: Published Article links to Draft Article: ${link}`);
        }
      }
    }
  }

  if (pinnedCount > 2) {
    errors.push('articles: no more than 2 Published articles may be pinned');
  }

  return errors;
}

export function sortArticles(articles: readonly Article[]): Article[] {
  return articles.toSorted((left, right) => {
    const leftPinned = left.frontmatter.pinned ? 1 : 0;
    const rightPinned = right.frontmatter.pinned ? 1 : 0;
    if (leftPinned !== rightPinned) return rightPinned - leftPinned;
    return (right.frontmatter.publishedAt ?? '').localeCompare(left.frontmatter.publishedAt ?? '');
  });
}
function getAstroModules(): Record<string, MarkdownInstance<ArticleFrontmatter>> {
  try {
    return import.meta.glob<MarkdownInstance<ArticleFrontmatter>>(
      '/src/content/articles/*/index.md',
      { eager: true },
    );
  } catch {
    return {};
  }
}

const loadedEntries = Object.entries(getAstroModules()).map(([file, markdown]) => {
  const dir = resolve(dirname(file.startsWith('/') ? file.slice(1) : file));
  const slug = file.split('/').at(-2) ?? '';
  let metadata: Record<string, unknown> = { ...markdown.frontmatter };
  const yamlPath = resolve(dir, 'metadata.yaml');
  const ymlPath = resolve(dir, 'metadata.yml');
  if (existsSync(yamlPath) || existsSync(ymlPath)) {
    const target = existsSync(yamlPath) ? yamlPath : ymlPath;
    const raw = readFileSync(target, 'utf8');
    const wrapped = raw.startsWith('---') ? raw : `---\n${raw}\n---`;
    metadata = (matter(wrapped).data as Record<string, unknown>) ?? {};
  }

  const result = parseAndValidateArticle(
    {
      frontmatter: metadata,
      content: markdown.rawContent(),
    },
    {
      slug,
      file,
      baseDirectory: dir,
    },
  );
  if (!result.article) {
    throw new Error(result.errors.join('\n'));
  }
  const parsed = result.article;
  const article = {
    slug,
    path: `/articles/${slug}/` as const,
    frontmatter: {
      title: parsed.title,
      summary: parsed.summary,
      state: parsed.state,
      ...(parsed.publishedAt ? { publishedAt: parsed.publishedAt } : {}),
      ...(parsed.revisedAt ? { revisedAt: parsed.revisedAt } : {}),
      ...(parsed.tags ? { tags: parsed.tags } : {}),
      ...(parsed.aliases ? { aliases: parsed.aliases } : {}),
      ...(typeof parsed.pinned === 'boolean' ? { pinned: parsed.pinned } : {}),
    },
    Content: markdown.Content,
    headings: markdown.getHeadings(),
    outline: parsed.outline ?? extractArticleOutline(markdown.getHeadings()),
    readingMinutes: parsed.readingMinutes,
  } satisfies Article;
  return { article, parsed };
});

const collectionErrors = validateArticleCollection(
  loadedEntries.map((entry) => entry.parsed),
);
if (collectionErrors.length > 0) {
  throw new Error(collectionErrors.join('\n'));
}

const loaded = loadedEntries.map((entry) => entry.article);

export const allArticles = sortArticles(loaded);
export const publishedArticles =
  process.env.EMPTY_ARTICLES === '1'
    ? []
    : allArticles.filter((article) => article.frontmatter.state === 'Published');
export function visibleArticles(isDev: boolean): Article[] {
  return isDev ? allArticles : publishedArticles;
}

const neighborMap = new Map<string, { newer?: Article; older?: Article }>();
for (let i = 0; i < publishedArticles.length; i++) {
  const current = publishedArticles[i];
  if (!current) continue;
  const newer = i > 0 ? publishedArticles[i - 1] : undefined;
  const older = i + 1 < publishedArticles.length ? publishedArticles[i + 1] : undefined;
  neighborMap.set(current.slug, {
    ...(newer ? { newer } : {}),
    ...(older ? { older } : {}),
  });
}

export function articleNeighbors(article: Article): {
  newer?: Article;
  older?: Article;
} {
  return neighborMap.get(article.slug) ?? {};
}

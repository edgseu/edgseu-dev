import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { normalizeDate } from '../../src/lib/articles';

/**
 * Filesystem-based article catalog for e2e tests.
 *
 * `src/lib/articles` builds its collection through `import.meta.glob`, which
 * only exists under Vite; Playwright's runner therefore always sees an empty
 * collection. These tests only need published-article metadata, which is read
 * here straight from each article folder's metadata.yaml using the same
 * split-file layout and date normalization as the production pipeline.
 */
export interface TestArticle {
  slug: string;
  path: `/articles/${string}/`;
  frontmatter: {
    title: string;
    summary: string;
    state: 'Published';
    publishedAt?: string;
    revisedAt?: string;
    tags?: string[];
    aliases?: string[];
    pinned?: boolean;
    series?: string;
    seriesSlug?: string;
    part?: number;
  };
}

export function seriesSlug(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
}

function readPublishedArticles(): TestArticle[] {
  const root = join(process.cwd(), 'src', 'content', 'articles');
  if (!existsSync(root)) return [];

  const articles: TestArticle[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const yamlPath = join(root, entry.name, 'metadata.yaml');
    const ymlPath = join(root, entry.name, 'metadata.yml');
    const target = existsSync(yamlPath) ? yamlPath : existsSync(ymlPath) ? ymlPath : undefined;
    if (!target) continue;

    const raw = readFileSync(target, 'utf8');
    const wrapped = raw.startsWith('---') ? raw : `---\n${raw}\n---`;
    const data = (matter(wrapped).data ?? {}) as Record<string, unknown>;
    if (data.state !== 'Published') continue;

    const publishedAt = normalizeDate(data.publishedAt);
    const revisedAt = normalizeDate(data.revisedAt);
    const series = typeof data.series === 'string' ? data.series.trim() : undefined;
    articles.push({
      slug: entry.name,
      path: `/articles/${entry.name}/`,
      frontmatter: {
        title: String(data.title ?? ''),
        summary: String(data.summary ?? ''),
        state: 'Published',
        ...(publishedAt ? { publishedAt } : {}),
        ...(revisedAt ? { revisedAt } : {}),
        ...(Array.isArray(data.tags) ? { tags: data.tags.map(String) } : {}),
        ...(Array.isArray(data.aliases) ? { aliases: data.aliases.map(String) } : {}),
        ...(typeof data.pinned === 'boolean' ? { pinned: data.pinned } : {}),
        ...(series ? { series, seriesSlug: seriesSlug(series) } : {}),
        ...(typeof data.part === 'number' ? { part: data.part } : {}),
      },
    });
  }

  // Same ordering contract as sortArticles: pinned first, then newest date.
  return articles.sort((left, right) => {
    const leftPinned = left.frontmatter.pinned ? 1 : 0;
    const rightPinned = right.frontmatter.pinned ? 1 : 0;
    if (leftPinned !== rightPinned) return rightPinned - leftPinned;
    return (right.frontmatter.publishedAt ?? '').localeCompare(left.frontmatter.publishedAt ?? '');
  });
}

export const publishedArticles: TestArticle[] = readPublishedArticles();

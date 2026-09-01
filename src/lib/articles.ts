import type { MarkdownInstance } from 'astro';

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

export interface Article {
  slug: string;
  path: `/articles/${string}/`;
  frontmatter: ArticleFrontmatter;
  Content: MarkdownInstance<ArticleFrontmatter>['Content'];
  headings: MarkdownInstance<ArticleFrontmatter>['getHeadings'] extends () => infer T ? T : never;
  readingMinutes: number;
}

const modules = import.meta.glob<MarkdownInstance<ArticleFrontmatter>>(
  '/src/content/articles/*/index.md',
  { eager: true },
);

const loaded = Object.entries(modules).map(([file, article]) => {
  const slug = file.split('/').at(-2) ?? '';
  const words = article.rawContent().trim().split(/\s+/u).length;
  const publishedAt = article.frontmatter.publishedAt
    ? new Date(article.frontmatter.publishedAt).toISOString().slice(0, 10)
    : undefined;
  const revisedAt = article.frontmatter.revisedAt
    ? new Date(article.frontmatter.revisedAt).toISOString().slice(0, 10)
    : undefined;
  return {
    slug,
    path: `/articles/${slug}/` as const,
    frontmatter: {
      ...article.frontmatter,
      ...(publishedAt ? { publishedAt } : {}),
      ...(revisedAt ? { revisedAt } : {}),
      ...(typeof article.frontmatter.pinned === 'boolean' ? { pinned: article.frontmatter.pinned } : {}),
    },
    Content: article.Content,
    headings: article.getHeadings(),
    readingMinutes: Math.max(1, Math.ceil(words / 220)),
  } satisfies Article;
});

export const allArticles = loaded.toSorted((left, right) => {
  const leftPinned = Boolean(left.frontmatter.pinned);
  const rightPinned = Boolean(right.frontmatter.pinned);
  if (leftPinned !== rightPinned) return leftPinned ? -1 : 1;
  return (right.frontmatter.publishedAt ?? '').localeCompare(left.frontmatter.publishedAt ?? '');
});

export const publishedArticles = process.env.EMPTY_ARTICLES === '1'
  ? []
  : allArticles.filter((article) => article.frontmatter.state === 'Published');

export function visibleArticles(isDev: boolean): Article[] {
  return isDev ? allArticles : publishedArticles;
}

export function articleNeighbors(article: Article): {
  newer?: Article;
  older?: Article;
} {
  const index = publishedArticles.findIndex((candidate) => candidate.slug === article.slug);
  const newer = index > 0 ? publishedArticles[index - 1] : undefined;
  const older = index >= 0 ? publishedArticles[index + 1] : undefined;
  return { ...(newer ? { newer } : {}), ...(older ? { older } : {}) };
}

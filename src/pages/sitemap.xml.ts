import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { publishedArticles } from '../lib/articles';

export const GET: APIRoute = () => {
  const latestArticleDate = publishedArticles[0]?.frontmatter.revisedAt ?? publishedArticles[0]?.frontmatter.publishedAt;
  const staticLastMod = latestArticleDate ?? new Date().toISOString().slice(0, 10);

  const entries = [
    { path: '/', lastmod: staticLastMod },
    { path: '/projects/', lastmod: staticLastMod },
    { path: '/articles/', lastmod: staticLastMod },
    { path: '/resume/', lastmod: staticLastMod },
    ...publishedArticles.map((article) => ({
      path: article.path,
      lastmod: article.frontmatter.revisedAt ?? article.frontmatter.publishedAt ?? staticLastMod,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map((entry) => `  <url>\n    <loc>${new URL(entry.path, site.canonicalUrl).href}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n  </url>`)
    .join('\n')}\n</urlset>\n`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

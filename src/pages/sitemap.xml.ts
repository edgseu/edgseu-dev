import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { publishedArticles } from '../lib/articles';

export const GET: APIRoute = () => {
  const paths = ['/', '/projects/', '/articles/', ...publishedArticles.map((article) => article.path)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map((path) => `  <url><loc>${new URL(path, site.canonicalUrl).href}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

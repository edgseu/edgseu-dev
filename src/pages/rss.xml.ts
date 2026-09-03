import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { profile } from '../data/profile';
import { publishedArticles } from '../lib/articles';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/gu, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

export const GET: APIRoute = () => {
  const items = publishedArticles.map((article) => {
    const articleUrl = new URL(article.path, site.canonicalUrl).href;
    const pubDate = article.frontmatter.publishedAt ? new Date(article.frontmatter.publishedAt).toUTCString() : '';
    const categories = (article.frontmatter.tags ?? []).map((tag) => `      <category>${escapeXml(tag)}</category>`).join('\n');
    return `    <item>
      <title>${escapeXml(article.frontmatter.title)}</title>
      <description>${escapeXml(article.frontmatter.summary)}</description>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
${categories ? `${categories}\n` : ''}    </item>`;
  });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(profile.username)}</title>
    <description>${escapeXml(`${profile.name}'s Technical Writing & Cloud Security Engineering Blog`)}</description>
    <link>${site.canonicalUrl}</link>
    <atom:link href="${new URL('/rss.xml', site.canonicalUrl).href}" rel="self" type="application/rss+xml" />
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>
`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};

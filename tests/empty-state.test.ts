import assert from 'node:assert/strict';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { allArticles } from '../src/lib/articles';

const output = 'dist-empty';

test('production build excludes Article routes and renders truthful empty states', () => {
  rmSync(output, { recursive: true, force: true });
  const result = spawnSync('pnpm', ['astro', 'build', '--outDir', output], {
    cwd: process.cwd(),
    env: { ...process.env, EMPTY_ARTICLES: '1' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const homepage = readFileSync(join(output, 'index.html'), 'utf8');
  const articles = readFileSync(join(output, 'articles/index.html'), 'utf8');
  const sitemap = readFileSync(join(output, 'sitemap.xml'), 'utf8');
  assert.match(homepage, /No articles are published yet/);
  assert.match(articles, /No articles are published yet/);
  for (const article of allArticles) {
    assert.doesNotMatch(sitemap, new RegExp(`/articles/${article.slug}/`));
    assert.throws(() => readFileSync(join(output, `articles/${article.slug}/index.html`)));
  }
  rmSync(output, { recursive: true, force: true });
});

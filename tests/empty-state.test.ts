import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const output = 'dist-empty';

function listArticleSlugs(): string[] {
  const root = join(process.cwd(), 'src', 'content', 'articles');
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

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
  for (const slug of listArticleSlugs()) {
    assert.doesNotMatch(sitemap, new RegExp(`/articles/${slug}/`));
    assert.throws(() => readFileSync(join(output, `articles/${slug}/index.html`)));
  }
  rmSync(output, { recursive: true, force: true });
});

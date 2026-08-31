import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

function runValidation(source: string): { status: number | null; output: string } {
  const root = join(tmpdir(), `edgseu-content-${crypto.randomUUID()}`);
  const article = join(root, 'invalid-article');
  mkdirSync(article, { recursive: true });
  writeFileSync(join(article, 'index.md'), source);
  const result = spawnSync('pnpm', ['exec', 'tsx', 'scripts/validate-content.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, ARTICLE_ROOT: root },
    encoding: 'utf8',
  });
  rmSync(root, { recursive: true, force: true });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

test('valid portable Article passes the public validation command', () => {
  const result = runValidation(`---
title: Valid Article
summary: A portable validation fixture.
state: Published
publishedAt: 2026-08-30
tags: [Testing]
---

## First section

Portable body.

### Detail

\`\`\`text
plain output
\`\`\`
`);
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /Content validation passed/);
});

test('invalid Article reports actionable authoring boundaries together', () => {
  const result = runValidation(`---
title: Invalid Article
summary: An invalid validation fixture.
state: Published
publishedAt: 2099-01-01
tags: [Cloud, cloud, One, Two, Three]
---

# Authored H1

### Skipped heading

<div>raw HTML</div>

\`\`\`
no language
\`\`\`
`);
  assert.equal(result.status, 1);
  assert.match(result.output, /publishedAt cannot be in the future/);
  assert.match(result.output, /tags must contain zero to four/);
  assert.match(result.output, /frontmatter title is the only allowed H1/);
  assert.match(result.output, /heading level skips/);
  assert.match(result.output, /raw HTML is not portable/);
  assert.match(result.output, /code fence requires a recognized language/);
});

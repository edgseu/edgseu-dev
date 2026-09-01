import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

function runValidation(
  source: string,
  profileSource?: string,
): { status: number | null; output: string } {
  const root = join(tmpdir(), `edgseu-content-${crypto.randomUUID()}`);
  const article = join(root, 'invalid-article');
  const profile = join(root, 'profile.md');
  mkdirSync(article, { recursive: true });
  writeFileSync(join(article, 'index.md'), source);
  if (profileSource) writeFileSync(profile, profileSource);
  const result = spawnSync('pnpm', ['exec', 'tsx', 'scripts/validate-content.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ARTICLE_ROOT: root,
      ...(profileSource ? { PROFILE_FILE: profile } : {}),
    },
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

test('invalid Profile reports actionable authoring boundaries', () => {
  const result = runValidation(
    `---
title: Valid Article
summary: A portable validation fixture.
state: Draft
tags: []
---

## Valid article
`,
    `---
name: Aman Bhushan Singh
username: edgseu
role: Cloud Security & Operations Engineer
location: India
email: not-an-email
github: relative/github
linkedin: https://www.linkedin.com/in/amanbs
avatar: images/avatar.png
promptHost: cloud
host: cloud-node
resumeUrl: ""
focusAreas: [Cloud, cloud]
shortSkills: []
skills: [AWS EKS]
---
`,
  );

  assert.equal(result.status, 1);
  assert.match(result.output, /email must be a valid email address/);
  assert.match(result.output, /github must be an absolute HTTPS URL/);
  assert.match(result.output, /avatar must be a root-relative path/);
  assert.match(result.output, /resumeUrl must be null or an absolute HTTPS URL/);
  assert.match(result.output, /focusAreas must contain unique values/);
  assert.match(result.output, /shortSkills must contain at least one value/);
  assert.match(result.output, /Profile narrative must not be empty/);
});

const profileFixture = `---
name: Aman Bhushan Singh
username: edgseu
role: Cloud Security & Operations Engineer
location: India
email: mail@edgseu.dev
github: https://github.com/h1zardian
linkedin: https://www.linkedin.com/in/amanbs
avatar: /images/avatar.png
promptHost: cloud
host: cloud-node
resumeUrl: RESUME_URL
focusAreas: [Cloud infrastructure]
shortSkills: [AWS]
skills: [AWS EKS]
---

## Profile narrative
`;

for (const resumeUrl of ['null', 'https://example.com/resume.pdf']) {
  test(`Profile accepts resumeUrl: ${resumeUrl}`, () => {
    const result = runValidation(
      `---
title: Valid Article
summary: A portable validation fixture.
state: Draft
tags: []
---

## Valid article
`,
      profileFixture.replace('RESUME_URL', resumeUrl),
    );

    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /Content validation passed/);
  });
}

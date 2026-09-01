import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateReadingMinutes,
  parseAndValidateArticle,
  sortArticles,
  validateArticleCollection,
  type Article,
} from '../src/lib/articles';
import { profileSchema, validateProfileFile } from '../src/lib/profile';
import matter from 'gray-matter';

test('valid portable Article passes in-memory validation', () => {
  const result = parseAndValidateArticle(`---
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
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.article?.title, 'Valid Article');
  assert.equal(result.article?.state, 'Published');
  assert.equal(result.article?.publishedAt, '2026-08-30');
  assert.equal(result.article?.readingMinutes, 1);
});
test('structured Article source uses the same validation and normalization interface', () => {
  const result = parseAndValidateArticle({
    frontmatter: {
      title: 'Astro Adapter Article',
      summary: 'Structured input from the Astro Markdown adapter.',
      state: 'Published',
      publishedAt: '2026-08-30',
      tags: ['Astro'],
    },
    content: '## Shared validation\n\nPortable body.',
  });

  assert.equal(result.valid, true);
  assert.equal(result.article?.publishedAt, '2026-08-30');
  assert.equal(result.article?.readingMinutes, 1);
});

test('article validation rejects loose dates and non-array metadata', () => {
  const result = parseAndValidateArticle(
    `---
title: Loose Metadata
summary: Invalid primitive metadata must not be discarded.
state: Published
publishedAt: "August 30, 2026"
tags: cloud
aliases: /articles/old-route/
---

## Body
`,
    { currentDate: '2026-09-02' },
  );

  assert.equal(result.valid, false);
  const errorText = result.errors.join('\n');
  assert.match(errorText, /publishedAt must use a valid YYYY-MM-DD calendar date/);
  assert.match(errorText, /tags must be an array/);
  assert.match(errorText, /aliases must be an array/);
});

test('article validation rejects impossible calendar dates', () => {
  const result = parseAndValidateArticle(
    `---
title: Impossible Date
summary: Calendar validation must reject normalized overflow.
state: Published
publishedAt: "2026-02-31"
---

## Body
`,
    { currentDate: '2026-09-02' },
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /valid YYYY-MM-DD calendar date/);
});

test('invalid Article reports actionable authoring boundaries together', () => {
  const result = parseAndValidateArticle(
    `---
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
`,
    { currentDate: '2026-09-01' },
  );

  assert.equal(result.valid, false);
  const errorText = result.errors.join('\n');
  assert.match(errorText, /publishedAt cannot be in the future/);
  assert.match(errorText, /tags must contain zero to four/);
  assert.match(errorText, /frontmatter title is the only allowed H1/);
  assert.match(errorText, /heading level skips/);
  assert.match(errorText, /raw HTML is not portable/);
  assert.match(errorText, /code fence requires a recognized language/);
});

test('article validation rejects duplicate anchors, bad aliases, and invalid code meta', () => {
  const result = parseAndValidateArticle(`---
title: Broken Article
summary: Testing anchor and alias errors.
state: Draft
publishedAt: 2026-08-01
aliases: [/bad-alias/]
pinned: 123
---

## Same Title

## Same Title

\`\`\`ts invalid unquoted title
const x = 1;
\`\`\`
`);

  assert.equal(result.valid, false);
  const errorText = result.errors.join('\n');
  assert.match(errorText, /Draft Articles must not declare publishedAt/);
  assert.match(errorText, /invalid Article alias/);
  assert.match(errorText, /pinned must be a boolean/);
  assert.match(errorText, /duplicate normalized H2\/H3 anchor/);
  assert.match(errorText, /code fence metadata may contain only one quoted title/);
});

test('validateArticleCollection catches pin overflow, route collisions, and draft links', () => {
  const collection = [
    {
      slug: 'article-1',
      title: 'A1',
      summary: 'S1',
      state: 'Published' as const,
      publishedAt: '2026-08-01',
      pinned: true,
      links: ['/articles/draft-article/'],
      readingMinutes: 1,
    },
    {
      slug: 'article-2',
      title: 'A2',
      summary: 'S2',
      state: 'Published' as const,
      publishedAt: '2026-08-02',
      pinned: true,
      aliases: ['/articles/article-1/'],
      links: [],
      readingMinutes: 1,
    },
    {
      slug: 'article-3',
      title: 'A3',
      summary: 'S3',
      state: 'Published' as const,
      publishedAt: '2026-08-03',
      pinned: true,
      links: [],
      readingMinutes: 1,
    },
    {
      slug: 'draft-article',
      title: 'Draft',
      summary: 'Draft S',
      state: 'Draft' as const,
      links: [],
      readingMinutes: 1,
    },
  ];

  const errors = validateArticleCollection(collection);
  const errorText = errors.join('\n');
  assert.match(errorText, /no more than 2 Published articles may be pinned/);
  assert.match(errorText, /alias collides with another Article route/);
  assert.match(errorText, /Published Article links to Draft Article/);
});
test('validateArticleCollection detects aliases that precede colliding canonical routes', () => {
  const base = {
    title: 'Article',
    summary: 'Summary',
    state: 'Draft' as const,
    links: [],
    readingMinutes: 1,
  };
  const errors = validateArticleCollection([
    { ...base, slug: 'first', aliases: ['/articles/second/'] },
    { ...base, slug: 'second' },
  ]);

  assert.match(errors.join('\n'), /alias collides with another Article route/);
});

test('calculateReadingMinutes calculates word count accurately', () => {
  assert.equal(calculateReadingMinutes('one two three'), 1);
  const longText = Array.from({ length: 450 }, () => 'word').join(' ');
  assert.equal(calculateReadingMinutes(longText), 3);
});

test('sortArticles places pinned articles first, then newest published date', () => {
  const dummyComponent = (() => null) as unknown as Article['Content'];
  const articles: Article[] = [
    {
      slug: 'old-unpinned',
      path: '/articles/old-unpinned/',
      frontmatter: {
        title: 'Old Unpinned',
        summary: 'S',
        state: 'Published',
        publishedAt: '2026-01-01',
        pinned: false,
      },
      Content: dummyComponent,
      headings: [],
      readingMinutes: 1,
    },
    {
      slug: 'new-unpinned',
      path: '/articles/new-unpinned/',
      frontmatter: {
        title: 'New Unpinned',
        summary: 'S',
        state: 'Published',
        publishedAt: '2026-08-01',
        pinned: false,
      },
      Content: dummyComponent,
      headings: [],
      readingMinutes: 1,
    },
    {
      slug: 'pinned-article',
      path: '/articles/pinned-article/',
      frontmatter: {
        title: 'Pinned Article',
        summary: 'S',
        state: 'Published',
        publishedAt: '2026-05-01',
        pinned: true,
      },
      Content: dummyComponent,
      headings: [],
      readingMinutes: 1,
    },
  ];

  const sorted = sortArticles(articles);
  assert.deepEqual(
    sorted.map((a) => a.slug),
    ['pinned-article', 'new-unpinned', 'old-unpinned'],
  );
});

test('invalid Profile schema reports actionable authoring boundaries', () => {
  const invalidProfile = {
    name: 'Aman Bhushan Singh',
    username: 'edgseu',
    role: 'Cloud Security & Operations Engineer',
    location: 'India',
    email: 'not-an-email',
    github: 'relative/github',
    linkedin: 'https://www.linkedin.com/in/amanbs',
    avatar: 'images/avatar.png',
    promptHost: 'cloud',
    host: 'cloud-node',
    resumeUrl: '',
    focusAreas: ['Cloud', 'cloud'],
    shortSkills: [],
    skills: ['AWS EKS'],
  };

  const result = profileSchema.safeParse(invalidProfile);
  assert.equal(result.success, false);
  if (!result.success) {
    const errorMap = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    assert.match(errorMap, /email: must be a valid email address/);
    assert.match(errorMap, /github: must be an absolute HTTPS URL/);
    assert.match(errorMap, /avatar: must be a root-relative path/);
    assert.match(errorMap, /resumeUrl: must be null or an absolute HTTPS URL/);
    assert.match(errorMap, /focusAreas: must contain unique values/);
    assert.match(errorMap, /shortSkills: must contain at least one value/);
  }
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
    const parsed = matter(profileFixture.replace('RESUME_URL', resumeUrl));
    const result = profileSchema.safeParse(parsed.data);
    assert.equal(result.success, true);
  });
}

test('validateProfileFile reads and validates production profile without errors', () => {
  const result = validateProfileFile();
  assert.equal(result.errors.length, 0);
  assert.ok(result.profile);
  assert.equal(result.profile?.username, 'edgseu');
});

---
name: article-writing
description: Write and publish articles for the edgseu.dev Astro site (src/content/articles). Use when the user asks to write, draft, edit, revise, or publish an article, blog post, or series part for this project, or when an article fails content validation.
---

# Writing Articles for edgseu.dev

This repo is a personal technical site (https://edgseu.dev) built with Astro. Articles are not plain markdown dumps: they pass a strict validator at build time, and pushing to `main` deploys to production. Read this skill fully before writing a single line; it encodes the validator rules and the author's voice, both of which are non-negotiable.

## Where articles live

- Published content: `src/content/articles/<slug>/index.md` plus a `metadata.yaml` sidecar in the same directory. The slug is the URL: lowercase kebab-case, no trailing slash.
- Images live in the same article folder: `src/content/articles/<slug>/images/`, referenced with relative paths.
- `local-research/` is gitignored and is the scratch area for research, master drafts, and oversized images. Do the messy work there, then copy the finished article into `src/content/articles/`.
- Existing articles are the best style reference. Read at least one recent one before writing.

## Metadata schema (metadata.yaml)

Quote all string values (`title: "..."`, `summary: "..."`, `series: "..."`) to survive YAML colons. Keys are lowercase camelCase exactly as listed.

| Field | Rules |
|---|---|
| `title` | Required. Plain text, no `#`, `<`, `>`, or newlines. |
| `summary` | Required. Plain text, same bans, and **unique across all articles** (the artifact gate enforces this). |
| `state` | `Draft` or `Published`. Drafts never ship to production. |
| `publishedAt` | `YYYY-MM-DD`. Required for `Published`, forbidden for `Draft`, must not be in the future (checked against the UTC date, not local time). |
| `revisedAt` | Optional `YYYY-MM-DD`, must be on or after `publishedAt`. Only add it when an already-published article is substantively revised. |
| `tags` | Array of 0 to 4 nonempty strings, unique ignoring case. |
| `pinned` | Optional boolean. At most 2 published articles may be pinned. |
| `aliases` | Optional array of `/articles/<old-slug>/` routes that 301-style redirect here. Must not collide with real routes. Keep an alias whenever a slug changes or an old URL must keep working. |
| `series` | Optional plain text, 80 chars max, spelled identically in every member article. |
| `part` | Optional integer 1–99. All-or-none per series, unique within it. If omitted for a multi-article series, parts are derived from `publishedAt` order. |

## Body rules (the validator rejects violations at build)

- No H1 in the body: the frontmatter title is the H1. Start sections at `##`.
- Headings H2–H4 only, never skip a level, unique H2/H3 anchor text.
- No raw HTML anywhere, including HTML comments.
- Code fences must use an allowlisted language: `bash css diff dockerfile go hcl html javascript json jsx kotlin markdown plaintext python rust shell sql text toml tsx typescript xml yaml yml`. For `ini`, `kql`, config dumps, transcripts, and anything unrecognized, use `text`. Fences may carry exactly one quoted title: ```` ```bash "title" ````.
- Images: relative paths into the article's `images/` dir, formats `png jpg jpeg webp svg`, and every image needs alt text (explicit empty `![]()` is allowed but avoid it for meaningful figures). Each image must be ≤ 200 KiB after optimization (`pnpm exec tsx scripts/check-artifact.ts` enforces it, and it also walks every built route).
- Links: external `https://`, `mailto:`, anchors, or internal routes (`/articles/<slug>/`, `/projects/`). Local asset paths must exist on disk. Published articles must not link to drafts.
- Images with transparency render on both dark and light themes: put screenshots on a solid background card or export with a solid background so they never look broken in light theme.

## Voice and style (the author's rules)

- **Never use em-dashes or semicolons in prose.** Use a comma or a colon instead. This applies to body text, captions, alt text, summaries, and SVG text. Code blocks and inline code are exempt.
- Tone: tight narrative with high technical density. Short punchy sentences carry a story, then go deep. Not a dry changelog, not a listicle, no filler intros like "In today's world".
- Be honest, including self-critically: if the article is an autopsy or evaluation, state what failed and why in plain terms.
- Facts must be verified against primary sources (source code, live sessions, screenshots taken during the work), not paraphrased from memory. If a screenshot is the evidence, the text must match it exactly (versions, banners, paths).
- When screenshots contain sensitive data, redact with solid black boxes over whole elements, not blur or scribbles.
- Keep the reader oriented in long technical pieces: use `##` sections that make a working table of contents, and lead each section with the point before the detail.

## Series

A series is just several articles sharing `series` (+ `part`). The site renders a "Series Part: N" pill on cards, a series rail on `/articles/`, a series card beside the table of contents on article pages, and `?series=<slug>` filtering. When adding to an existing series, match the existing series name exactly and keep the part numbering consistent.

## Verification loop (run all of it before pushing)

```bash
pnpm validate                                # content validation
pnpm build                                   # production build (drafts excluded)
pnpm test:validation                         # unit tests
pnpm test:e2e                                # Playwright suite
pnpm exec tsx scripts/check-artifact.ts      # artifact gate: routes, summaries, image sizes
```

All five must pass. `pnpm dev` renders drafts locally (`state: Draft` never appears in production builds or the artifact gate), so preview drafts with dev before flipping state to `Published`.

## Publishing

- Deploy is `git push origin main` (GitHub Actions workflow `site.yml`). There is no separate publish step, so never push broken content to `main`.
- Verify the deploy: `MISE_QUIET=1 mise x gh@2.99.0 -- gh run watch <run-id> --exit-status` (invoke gh through mise like that; the bare shim fails in this environment).
- After deploy, open the live URL and confirm the article renders, images load, and the table of contents is right.

## When validation fails

Read the error; it is written to be actionable (file, rule). Common causes: unquoted YAML colons in `title`/`summary`/`series`, a future `publishedAt`, a fence language outside the allowlist, an image over 200 KiB, a summary duplicating another article's, or a heading level skip. Fix the content, not the validator, unless the user explicitly asks for a rule change.

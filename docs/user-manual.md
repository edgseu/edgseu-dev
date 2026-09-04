# edgseu.dev user manual

This is the owner’s operating guide for updating, validating, publishing, hosting, and maintaining the site. It describes the repository as it currently works. Start here after a long break from the project.

## 1. Quick reference

### The content sources you will edit most often

| What you want to change | Authoritative file |
| --- | --- |
| Name, role, location, contact links, resume PDF target, skills, availability | `src/content/metadata.yaml` |
| Homepage biography Markdown narrative | `src/content/bio.md` |
| Projects, project order, lifecycle, publication state, tags, and homepage selection | `src/content/projects.yaml` |
| Articles, drafts, publication dates, tags, series, redirects, and article body | `src/content/articles/<slug>/` (`metadata.yaml` + `index.md`) |
| Resume page content rendered at `/resume/` | `src/content/resume.md` |

Do not edit `src/data/profile.ts` or `src/data/projects.ts`; they only load and export the validated content. Do not edit `.astro/` or `dist/`; both are generated.

### Normal update workflow

```bash
git switch -c content/short-description
pnpm install --frozen-lockfile
git config core.hooksPath .githooks
pnpm dev
```

Make the change and inspect it in the browser. The pre-commit hook runs the full release gate on every `git commit`, so a commit that lands has already passed validation, the production build, unit tests, the browser suite, and the artifact check. Push and merge, and the push to `main` deploys production.

### Important URLs

- Production site: <https://edgseu.dev/>
- Resume page: <https://edgseu.dev/resume/>
- Repository: <https://github.com/edgseu/edgseu-dev>
- GitHub Actions: <https://github.com/edgseu/edgseu-dev/actions>
- Article discussions: <https://github.com/edgseu/edgseu-dev/discussions/categories/article-comments>
- Production sitemap: <https://edgseu.dev/sitemap.xml>

## 2. How the site is assembled

The site is an Astro static site. Astro reads the content and data during the build and writes ordinary HTML, CSS, JavaScript, fonts, images, `robots.txt`, and `sitemap.xml` into `dist/`. GitHub Pages serves that generated directory. There is no production database, server process, admin panel, or runtime CMS.

This has several practical consequences:

1. Repository files are the database and source of truth.
2. A content change is not live until a new build is deployed.
3. Draft articles can appear in the development server without entering the production build.
4. Published project metadata can be enriched from the GitHub API during a build.
5. Rollback means reverting a repository commit and letting the next deployment publish the previous content.

### Route map

| Route | Source |
| --- | --- |
| `/` | `src/pages/index.astro`, profile content, selected projects, and two latest articles |
| `/projects/` | `src/pages/projects.astro` and all published projects |
| `/articles/` | `src/pages/articles/index.astro`, the series rail, and all visible articles |
| `/articles/<slug>/` | `src/pages/articles/[slug].astro` and the matching article folder |
| Article alias routes | `src/pages/[...redirect].astro` and an article’s `aliases` list |
| `/resume/` | `src/pages/resume.astro` rendering `src/content/resume.md` |
| `/sitemap.xml` | `src/pages/sitemap.xml.ts` |
| `/robots.txt` | `public/robots.txt` copied as-is |

The Astro configuration uses static output and trailing slashes. Internal URLs and aliases should therefore use forms such as `/projects/` and `/articles/example-article/`, not versions without a final slash.

### Important repository areas

| Path | Purpose |
| --- | --- |
| `src/content/` | Owner-authored profile, articles, and resume |
| `src/data/` | Canonical site URL, profile export, and project catalog |
| `src/lib/` | Shared profile, Project catalog, Article authoring, and Terminal command modules |
| `src/pages/` | Public routes and page-specific behavior |
| `src/components/` | Cards, header, profile rail, terminal, icons, and article outline |
| `src/layouts/BaseLayout.astro` | Shared metadata, fonts, header, footer, theme initialization, and page shell |
| `src/styles/global.css` | Site-wide design, theming, resume layout, and print styles |
| `public/` | Files copied directly to the built site |
| `scripts/` | Content, artifact, performance, and external-link checks |
| `tests/` | Validation, rendering, and browser behavior tests |
| `.githooks/pre-commit` | The local release gate run on every commit |
| `.github/workflows/` | Pages deployment and the scheduled link review |

## 3. Local setup and operation

### Requirements

The repository declares:

- Node.js 24 (`.node-version` and `package.json`)
- pnpm 11.24.0 (`package.json`)

If pnpm is not available, enable Corepack and activate the repository’s pnpm version:

```bash
corepack enable
corepack prepare pnpm@11.24.0 --activate
```

Install dependencies exactly as recorded in `pnpm-lock.yaml`:

```bash
pnpm install --frozen-lockfile
```

Install the Chromium browser used by Playwright and Lighthouse:

```bash
pnpm exec playwright install chromium
```

On a fresh Linux CI-like machine that lacks browser system libraries, use:

```bash
pnpm exec playwright install --with-deps chromium
```

### Activate the pre-commit gate

The hook lives in `.githooks/pre-commit` and runs `pnpm quality` on every commit. Git does not pick it up automatically, so point the repository at the hooks directory once per clone:

```bash
git config core.hooksPath .githooks
```

Without this setting, commits run unchecked. The deployment workflow builds whatever reaches `main`, so an unhooked clone is the main way broken content can reach production.

### Development server

```bash
pnpm dev
```

Astro normally opens the site at <http://localhost:4321/>. Stop it with `Ctrl+C`.

Development mode is special: `visibleArticles(import.meta.env.DEV)` includes both `Draft` and `Published` articles. A draft displays a draft banner and receives `noindex, nofollow` metadata. This is the intended preview path.

Use the development server for:

- editing profile copy and seeing immediate updates;
- previewing draft articles;
- checking desktop and narrow layouts;
- using the terminal interaction, theme switcher, article outline, series rail, code-copy controls, and comments fallback;
- confirming that project and article cards are ordered as intended.

### Production build and preview

```bash
pnpm build
pnpm preview
```

`pnpm build` first runs content validation, linting, and Astro type checking, then writes the production artifact to `dist/`. Production excludes drafts. `pnpm preview` serves the existing `dist/` directory at <http://localhost:4321/> by default.

If the preview is stale, stop it, rerun `pnpm build`, then start `pnpm preview` again. Preview does not rebuild content automatically.

### Generated and temporary directories

Do not hand-edit these:

- `.astro/` — Astro-generated types and development state;
- `dist/` and `dist-*` — production and test builds;
- `test-results/` and `playwright-report/` — browser test output;
- `.debug/` — ad-hoc screenshots and local inspection artifacts;
- `node_modules/` — installed packages;
- Lighthouse JSON files under `artifacts/` — generated performance evidence.

Delete generated output only when troubleshooting a stale local build; the next command recreates it.

## 4. Updating the profile, biography, and resume

The profile is split into dedicated files:

1. `src/content/metadata.yaml` — structured identity, links, skills, and configuration.
2. `src/content/bio.md` — pure GitHub Flavored Markdown homepage biography narrative.
3. `src/content/resume.md` — the resume page body.

### Profile metadata template (`src/content/metadata.yaml`)

```yaml
name: Your full name
username: your-handle
role: Your professional role
location: Your location
email: you@example.com
github: https://github.com/your-account
linkedin: https://linkedin.com/in/your-profile
avatar: /images/avatar.png
promptHost: cloud
host: cloud-node
resumeUrl: https://example.com/resume.pdf
available: true
focusAreas:
  - Cloud infrastructure
  - DevSecOps
shortSkills:
  - AWS
  - Azure
skills:
  - AWS EKS
  - Azure AKS
```

### Homepage biography template (`src/content/bio.md`)

```markdown
## A short professional heading

Write the first paragraph of your homepage biography here.

Continue with your background, engineering focus, and current technical interests.
```

### Field behavior and validation

| Field | Required | Meaning and constraints |
| --- | --- | --- |
| `name` | Yes | Full display name; nonempty text. Used in the profile card and structured data. |
| `username` | Yes | Public handle; nonempty text. Used in the site title, footer, terminal prompt, and social metadata. |
| `role` | Yes | Professional title; nonempty text. Used in the profile card, terminal, page description, and structured data. |
| `location` | Yes | Display location; nonempty text. Also becomes the structured-data country value. |
| `email` | Yes | Must be a valid email address. Used for `mailto:` links and terminal contact output. |
| `github` | Yes | Absolute HTTPS URL. Used in the profile, footer, structured data, terminal, and external-link check. |
| `linkedin` | Yes | Absolute HTTPS URL. Used in the same public profile surfaces and external-link check. |
| `avatar` | Yes | Root-relative path beginning with one `/`, for example `/images/avatar.png`. |
| `promptHost` | Yes | Host text shown after `@` in the terminal prompt. |
| `host` | Yes | Host value printed by the terminal’s `whoami` command. |
| `resumeUrl` | Yes | Either an absolute HTTPS URL or YAML `null`. This is the PDF target for the Download action. Use `null` to hide both the rail link and the Download action. |
| `available` | No | Boolean. Set `true` to show the Available badge; omit it or use `false` to hide the badge. |
| `focusAreas` | Yes | At least one nonempty value; values must be unique ignoring case. Shown in the profile rail. |
| `shortSkills` | Yes | At least one unique nonempty value. Used in the initial terminal summary. |
| `skills` | Yes | At least one unique nonempty value. Used by the terminal `skills` command. |

The schema is strict. Unknown keys fail validation instead of being silently ignored. All three lists must contain at least one item and cannot contain case-insensitive duplicates.

The biography in `src/content/bio.md` must not be empty. It is rendered below the terminal. Keep the biography concise enough that selected projects and writing remain discoverable on the homepage.

### Updating the avatar

1. Put the replacement image in `public/images/`.
2. Prefer keeping the stable name `avatar.png`; replacing that file avoids changing profile data and cached references eventually expire.
3. If the filename changes, update `avatar` in `src/content/metadata.yaml`.
4. Keep the image optimized. The artifact gate rejects an initially loaded image larger than 200 KiB.
5. Run `pnpm quality` to confirm the file exists in the built artifact and remains within the page budget.

The rendered avatar is declared at 72 × 72 CSS pixels. Use a square source image to avoid awkward cropping or distortion.

### The resume page and the PDF target

The resume has two halves with different jobs:

- `/resume/` is a real page rendered from `src/content/resume.md`. Edit that Markdown to change the summary, skills, experience, projects, education, or certifications. The page adds its own header (name, role, contact links from the profile), a Download action at the top right, and a print stylesheet that renders a clean paper document when the visitor prints or saves as PDF.
- `resumeUrl` in `metadata.yaml` is the PDF target. The rail’s Resume button always opens `/resume/` when `resumeUrl` is configured, and both Download actions hand the visitor the file at that URL.

For an automatic PDF download from Google Docs, link the export endpoint rather than the published viewer: `https://docs.google.com/document/d/<DOCUMENT_ID>/export?format=pdf`. The document must be shared as anyone-with-the-link. A self-hosted `resume.pdf` under `public/` is the most durable option because it removes Google from the chain.

To remove the resume everywhere without touching components, use:

```yaml
resumeUrl: null
```

Do not use an empty string; it fails validation. After editing `resume.md`, run `pnpm validate`, open `/resume/` through `pnpm dev`, and check the print preview in the browser.

### Verify a profile change

```bash
pnpm validate
pnpm dev
```

Inspect the profile rail, terminal `whoami`, terminal `skills`, contact output, footer, page title and description, avatar, resume rail link, `/resume/`, and both light and dark themes.

## 5. Managing projects

The authoritative project catalog is `src/content/projects.yaml`. Each entry is curated in the top-level YAML array and enriched with public repository data during the build.

### Project template

```yaml
- id: repository-name
  title: Human-readable project title
  summary: A plain-text explanation of the problem, system, and important technologies.
  url: https://github.com/edgseu/repository-name
  state: Draft
  lifecycle: Active
  tags:
    - AWS
    - Terraform
    - Security
  order: 9
  pinned: false
```

### Project fields

| Field | Allowed values and rules |
| --- | --- |
| `id` | Lowercase kebab-case, unique project identifier matching the repository name. |
| `title` | Required nonempty display title. |
| `summary` | Plain text, 1–240 characters, with no line breaks, `<`, or `>`. |
| `url` | Canonical HTTPS GitHub repository URL, such as `https://github.com/edgseu/repository-name`. |
| `state` | `Draft` or `Published`. Only published projects render. |
| `lifecycle` | `Active`, `Maintained`, `Complete`, or `Archived`. |
| `tags` | One to six nonempty labels, unique ignoring case. |
| `order` | Unique integer. Lower numbers come first within the same pin group. |
| `pinned` | Optional boolean. Omit it or use `false` for normal ordering. At most four published projects may be pinned. |

The repository owner is dynamically resolved at runtime from `project.url` or `profile.github`. The enrichment implementation verifies that both the returned full name and URL match the local entry:

```text
id:  repository-name
API: <owner>/repository-name
url: https://github.com/<owner>/repository-name
```

A published repository must be public. A 404, private repository, renamed repository, moved repository, or mismatched URL fails the build with an actionable error.

### Sorting and homepage selection

Published projects are sorted in two stages:

1. pinned projects first;
2. `order` ascending within pinned and unpinned groups.

The projects page displays every published project in that result order.

The homepage behaves differently to keep the selected-project area compact:

- if zero, one, or two published projects are pinned, it shows the first two sorted projects;
- if three projects are pinned, it shows the first three;
- if four projects are pinned, it shows the first four;
- validation prevents more than four published pins.

### GitHub enrichment

During a normal build, `src/lib/projects.ts` calls GitHub’s repository and language endpoints with independent five-second timeouts. It uses `GITHUB_TOKEN` or `GH_TOKEN` when available; GitHub Actions supplies its job token automatically. When successful, the project card can receive:

- up to three major languages, ranked by GitHub’s reported byte counts and falling back to the primary language when totals are unavailable;
- last push date;
- archived status.

GitHub’s archived status overrides the curated `lifecycle` value and displays `Archived`. Other lifecycle values remain locally curated.

The build degrades safely when enrichment is unavailable:

- repository network errors, timeouts, HTTP 403, HTTP 429, and 5xx responses leave the curated card intact without enrichment metadata;
- language-endpoint failures retain the update date and fall back to GitHub’s primary language;
- HTTP 404 fails because the published repository is unavailable;
- a private repository or owner/name/URL mismatch fails;
- other unexpected repository responses leave the curated entry intact.

For an offline layout-only build, disable enrichment:

```bash
GITHUB_ENRICHMENT=off pnpm build
```

Do not use the disabled build as your only release verification. The deployment build performs normal enrichment and can catch moved, renamed, private, or deleted repositories.

Focused tests inject `FixtureMetadataProvider` directly for deterministic, network-free enrichment checks. `GITHUB_ENRICHMENT_FILE` remains available for a manual or integration build that needs fixture responses; it is not a normal content-management feature.

### Add a project safely

1. Create and document the public GitHub repository first.
2. Add the project object with `state: 'Draft'` and a new unique `order`.
3. Run `pnpm validate` and `pnpm check`.
4. Inspect the local cards. A draft project is filtered from normal pages, so temporarily using `Published` may be necessary for visual review; do not commit it as published until the repository is ready.
5. Confirm the repository owner, `id`, and URL match exactly.
6. Change `state` to `Published`.
7. Decide whether it deserves a homepage pin. Do not pin everything by default.
8. Commit. The pre-commit hook runs `pnpm quality` with network access.

### Hide or retire a project

- Set `state: 'Draft'` to remove it from the site while retaining its data.
- Set `lifecycle: 'Complete'` when the work is finished but remains useful.
- Set `lifecycle: 'Maintained'` when maintenance continues without active feature work.
- Set `lifecycle: 'Archived'` when it should be visibly historical. If the GitHub repository itself is archived, enrichment applies this automatically.

Removing a published project does not create a broken internal route because cards link directly to GitHub, but it changes project counts and homepage selection. Recheck both `/` and `/projects/`.

## 6. Writing and publishing articles

Each article lives in its own lowercase kebab-case directory containing its metadata and pure Markdown body:

```text
src/content/articles/my-article/
├── metadata.yaml
├── index.md
└── architecture.png
```

The folder name is the article slug and creates this route:

```text
/articles/my-article/
```

Only `index.md` and `metadata.yaml` are loaded. Top-level `.mdx` files are rejected, and MDX is not part of the content model.

### Draft article metadata template (`metadata.yaml`)

```yaml
title: A plain-text article title
summary: A unique plain-text description used on cards and in metadata.
state: Draft
tags:
  - Kubernetes
  - Security
```

### Article body template (`index.md`)

```markdown
## The first section

Write the article in portable Markdown.

### A subsection

Continue with evidence, examples, and operational detail.
```

Preview it with:

```bash
pnpm validate
pnpm dev
```

Open `/articles/my-article/`. Drafts appear in the local article index and have a visible draft banner. They are not included in production article cards, routes, redirects, article navigation, or the sitemap.

### Published article templates

The repository standard separates structured metadata from the Markdown prose:

#### Published article metadata template (`metadata.yaml`)

```yaml
title: A plain-text article title
summary: A unique plain-text description used on cards and in metadata.
state: Published
publishedAt: "2026-09-01"
revisedAt: "2026-09-15"
pinned: false
series: A plain-text series name
part: 1
tags:
  - Kubernetes
  - Security
aliases:
  - /articles/old-article-slug/
```

#### Published article body template (`index.md`)

```markdown
## The first section

Write the article in portable Markdown.

### A subsection

Continue with evidence, examples, and operational detail.
```

Single-file frontmatter (`---` block at the top of `index.md`) is also supported by the loader for portable standalone imports.

Remove fields you do not need. `revisedAt`, `pinned`, `tags`, `aliases`, `series`, and `part` are optional. `publishedAt` is mandatory for a published article.

### Metadata and frontmatter rules

| Field | Rules |
| --- | --- |
| `title` | Required plain text. It cannot contain `#`, `<`, `>`, or a line break. This frontmatter value becomes the page’s only H1. |
| `summary` | Required plain text. It cannot contain `#`, `<`, `>`, or a line break. Keep it specific and unique because duplicate descriptions fail the artifact gate. |
| `state` | Exactly `Draft` or `Published`. |
| `publishedAt` | Required for published articles, forbidden for drafts, valid `YYYY-MM-DD`, and not in the future. |
| `revisedAt` | Optional for published articles; must be on or after `publishedAt`. A draft cannot use it because it has no publication date. |
| `tags` | Optional list of zero to four nonempty strings, unique ignoring case. |
| `aliases` | Optional list of old article routes in exact `/articles/lowercase-kebab-case/` form. Keep an alias whenever a slug changes so old URLs keep working. |
| `pinned` | Optional boolean. At most two published articles may be pinned. |
| `series` | Optional nonempty plain text, 80 characters or fewer, without `#`, `<`, `>`, or a line break. Articles sharing a series name form one series and must spell the name identically. |
| `part` | Optional positive integer (1 to 99), only meaningful with `series`. If any article of a series declares `part`, every member must, and parts must be unique within the series. When no member declares it, the card derives the part from publication order. Article cards lead their tag list with a `Series Part: N` pill. |

### Series

Articles can belong to a named series by adding `series: <name>` to `metadata.yaml`. The site derives a slug from the name and uses it in three places:

- the sticky **Series** card on the left of `/articles/` lists every visible series with article counts; `Show all` (pressed by default) resets the view, and selecting a series filters the list and syncs the `?series=<slug>` query parameter;
- `/articles/?series=<slug>` deep-links (including browser back/forward) preselect that filter;
- on an article page whose metadata declares a series, a small sticky card below the table of contents shows the series name and links back to the filtered index.

Validation requires the same spelling for all articles of one series, so the card and rail always show one canonical name. Drafts participate in development previews the same way. Articles can declare `part: <n>` to pin their position; the article card then leads its tag list with a `Series Part: N` pill. When no member declares `part`, positions derive from publication order.

Use calendar dates deliberately. Do not update `publishedAt` when correcting an article. Add or update `revisedAt` only for a meaningful revision that readers should see.

### Article ordering

Articles are sorted as follows:

1. pinned articles first;
2. newest `publishedAt` first within each pin group.

The homepage displays the first two published articles after this sorting. The articles index displays the complete visible list. Previous/next article navigation uses the same published ordering.

Pinning is therefore a strong editorial override: an older pinned article can remain ahead of newer work. Use it for especially representative writing, not as a generic featured flag.

### Markdown structure rules

The validator enforces portable, predictable Markdown:

- Do not write an H1 (`# Heading`) in the body. The frontmatter title is the H1.
- Start body sections with H2 (`##`).
- H2, H3, and H4 are allowed; H5 and H6 are rejected.
- Do not skip levels. An H2 can be followed by H3, but not directly by H4.
- H2 and H3 headings must produce unique normalized anchors.
- Raw HTML is prohibited, including HTML comments.
- GitHub Flavored Markdown is enabled, including tables, task lists, and fenced code.

The page builds its “On this page” outline from Markdown headings. Good heading hierarchy is both a validation requirement and a navigation feature.

### Code fences

Every fenced code block must declare a recognized language, `text`, or `diff`. The allowlist is:

```text
bash css diff dockerfile go hcl html javascript json jsx kotlin markdown
plaintext python rust shell sql text toml tsx typescript xml yaml yml
```

Valid examples:

````markdown
```bash
pnpm validate
```

```yaml "deployment.yaml"
apiVersion: apps/v1
```
````

Optional code-fence metadata may contain only one quoted title. Unquoted titles, multiple metadata values, and unlabeled fences fail validation. Rendered code blocks receive a language or title header and a copy button.

### Links

Allowed absolute link schemes are `https:`, `http:`, and `mailto:`. Fragment-only links beginning with `#` are also accepted.

Root-relative internal links are limited to:

- `/`
- `/projects/`
- routes beginning with `/articles/`

Use trailing slashes for route links. Relative file links must resolve to a real file next to the article or below its directory.

A published article cannot link to a draft article. The validator resolves canonical article routes and aliases to enforce this.

The monthly external-link workflow checks profile links, the resume URL, and published project destinations. It does not currently crawl every external URL inside article prose, so manually open important article references before publishing.

### Article images

Keep article-specific images beside the article, for example:

```text
src/content/articles/my-article/
├── index.md
└── architecture.webp
```

Reference the image relatively:

```markdown
![Architecture showing the trust boundaries](./architecture.webp)
```

Rules:

- every image needs descriptive alt text or an intentional empty alt (`![](./decorative.svg)`);
- the local file must exist;
- committed article image formats are `.png`, `.jpg`, `.jpeg`, `.webp`, and `.svg`;
- use relative paths for article-local images; `/images/...` is not accepted by the article link validator;
- prefer screenshots on solid backgrounds so both themes render them cleanly;
- optimize images before committing them;
- the build automatically generates responsive `srcset` variants for article images (`image.layout: 'constrained'` in `astro.config.ts`), so commit one reasonably sized source image instead of hand-made size variants; and
- every article image, including every generated responsive variant, must remain at or below 200 KiB; the artifact gate verifies each `srcset` candidate.

Use empty alt text only for genuinely decorative images that add no information.

### Rename an article without breaking old links

1. Rename the article folder to the new lowercase kebab-case slug.
2. Add the old canonical route to the new article’s `aliases` list:

   ```yaml
   aliases:
     - /articles/old-slug/
   ```

3. Update internal links to use the new canonical route.
4. Ensure the alias does not collide with another canonical route or alias.
5. Commit; the pre-commit hook runs `pnpm quality`.
6. After deployment, confirm the old URL produces the “Article moved” page and immediately redirects to the new route.

Aliases are generated only for published articles. Alias pages use `noindex, follow` and point their canonical URL at the destination.

### Publish an article checklist

1. Finish the draft and proofread the title, summary, headings, links, code, and image alt text.
2. Run `pnpm validate` while it is still a draft.
3. Preview it through `pnpm dev` at desktop and narrow widths, in light and dark themes.
4. Set `state: Published`.
5. Add today’s real publication date in `YYYY-MM-DD` form.
6. Decide whether to pin it; no more than two published articles may be pinned.
7. Commit. The pre-commit hook runs the full gate, including a production build and the artifact check.
8. Push and merge to `main`, then open the production article after the deploy workflow finishes.
9. Verify the article, its outline links, code-copy controls, important outbound links, discussion section, and sitemap entry.

## 7. Comments and GitHub Discussions

Article comments use [Giscus](https://giscus.app/) and the repository’s GitHub Discussions. Comments are optional and progressively loaded; the article remains readable if GitHub or Giscus is blocked.

The article route is currently configured with:

- repository: derived dynamically from `profile.github` (e.g. `edgseu/edgseu-dev`);
- category: `Article comments`;
- mapping: exact pathname;
- strict mapping enabled;
- reactions enabled;
- comment input above the discussion;
- theme synchronized with the site theme.

The script loads only when the discussion section approaches the viewport or the visitor presses **Load comments**. Without configuration IDs, the site shows the fallback link to GitHub Discussions but does not render the load button.

### Configuration sources

Comments activate when both identifiers are present in the build environment:

- locally, through an ignored `.env` file:

  ```dotenv
  PUBLIC_GISCUS_REPO_ID=the_repository_id_from_giscus
  PUBLIC_GISCUS_CATEGORY_ID=the_category_id_from_giscus
  ```

  Restart the development server or rebuild after changing `.env`.

- in deployment, through repository variables named `GISCUS_REPO_ID` and `GISCUS_CATEGORY_ID` (without the `PUBLIC_` prefix). The deploy workflow’s build step maps them to `PUBLIC_GISCUS_REPO_ID` and `PUBLIC_GISCUS_CATEGORY_ID`. Set or update them under **Settings → Secrets and variables → Actions → Variables**; the next push to `main` picks them up.

These IDs are identifiers, not passwords, but repository variables keep the workflow configuration centralized.

### Giscus prerequisites

If comments stop working, verify:

1. the repository is public;
2. GitHub Discussions are enabled under repository settings;
3. the Giscus app is installed for the repository;
4. the `Article comments` discussion category still exists;
5. the IDs match the repository and category shown by giscus.app;
6. the hard-coded repository and category names in `src/pages/articles/[slug].astro` still match;
7. browser privacy tools are not blocking `https://giscus.app/client.js`.

Renaming the discussion category or moving the repository requires both code and variable updates.

## 8. Site identity, metadata, domain, and public assets

### Canonical site identity

The canonical production URL is declared in two primary places:

- `astro.config.ts` as Astro’s `site` value;
- `src/data/site.ts` as `site.canonicalUrl`.

The shared layout uses the canonical URL for canonical links, Open Graph images, Twitter images, and JSON-LD. The sitemap uses it for every `<loc>` entry.

The artifact gate currently hard-codes `https://edgseu.dev/` as the required canonical prefix and required robots sitemap. Tests also assert this domain. A domain migration is therefore a coordinated code change, not only a DNS edit.

### Fonts

The site self-hosts its two families through Fontsource packages imported in `src/layouts/BaseLayout.astro`: Adwaita Sans for sans-serif text and JetBrains Mono for monospace accents. No visitor depends on locally installed fonts, which keeps desktop and mobile rendering identical. Font stacks live in `src/styles/global.css` and the social card in `public/images/social-card.svg` mirrors the mono stack. When changing fonts, update both, then re-check heading letter-spacing and the outline scroll behavior, which is sensitive to text metrics.

### Public files

Current public identity files are:

| File | Purpose |
| --- | --- |
| `public/CNAME` | Tells GitHub Pages to serve the custom domain `edgseu.dev`. |
| `public/robots.txt` | Search crawler policy and canonical sitemap declaration. |
| `public/images/avatar.png` | Profile image. |
| `public/images/social-card.svg` | Default Open Graph and Twitter share image. |

Files under `public/` are copied to the root of `dist/`. For example, `public/images/social-card.svg` becomes `/images/social-card.svg`.

### Change the social card

Replace `public/images/social-card.svg` while retaining the filename, or update the `image` default in `src/layouts/BaseLayout.astro`. Rasterize the SVG locally (for example with `rsvg-convert`) and inspect the result before publishing, and keep every element inside the card bounds. Verify the built page’s `og:image` and `twitter:image` values afterward.

### Domain migration checklist

If the domain changes, update at least:

1. `astro.config.ts`;
2. `src/data/site.ts`;
3. `public/CNAME`;
4. the sitemap line in `public/robots.txt`;
5. hard-coded canonical checks in `scripts/check-artifact.ts`;
6. canonical URL expectations in tests;
7. GitHub Pages custom-domain settings;
8. DNS records at the domain provider;
9. Giscus or other repository integrations only if their repository/path identity also changes.

Then search the repository for the old hostname, commit (the hook runs `pnpm quality`), deploy, verify HTTPS, inspect `/robots.txt` and `/sitemap.xml`, and submit the new sitemap to any search tools you use.

## 9. Validation and quality gates

### Where the gate runs

Quality is enforced locally by `.githooks/pre-commit`, which runs `pnpm quality` on every commit and blocks the commit on any failure. The deployment workflow contains no tests; it trusts the gate because it runs in the same repository on the same commits. If the hook is bypassed (`git commit --no-verify`) or a clone skipped `core.hooksPath`, unchecked content can reach `main` and deploy, so keep the hook active.

### Command reference

| Command | What it does | When to use it |
| --- | --- | --- |
| `pnpm dev` | Starts Astro development mode with draft visibility. | During editing. |
| `pnpm validate` | Runs repository-specific profile, project, article, Markdown, date, link, and pin validation. | After every content edit. |
| `pnpm lint` | Runs ESLint (with `eslint-plugin-astro`) over `.ts` and `.astro` files. | After TypeScript or component changes. |
| `pnpm check` | Runs `pnpm validate`, then `pnpm lint`, then `astro check`. | After content or TypeScript/Astro changes. |
| `pnpm build` | Runs `pnpm check`, then creates `dist/`. | Before preview or tests. |
| `pnpm preview` | Serves the existing production artifact. | To inspect the exact draft-free build. |
| `pnpm test:validation` | Runs Node validation and rendering tests in `tests/*.test.ts`. | After changing schemas, loaders, or validation behavior. |
| `pnpm test:e2e` | Runs Playwright tests against an existing preview build. | After `pnpm build`, for browser behavior. |
| `pnpm test` | Builds, runs validation tests, then Playwright. | Before release. |
| `pnpm quality` | Runs `pnpm test`, then inspects the built artifact. | The release gate, run by the pre-commit hook. |
| `pnpm lighthouse` | Runs repeated Lighthouse measurements on representative routes and writes a summary. | After layout, script, CSS, image, or dependency changes. |
| `pnpm check:external` | Performs network requests to approved profile, resume, and published project URLs. | Before publishing link changes or while reviewing the monthly job. |

Running `pnpm test:e2e` by itself assumes `dist/` already exists because Playwright starts `astro preview`, not a build. When unsure, use `pnpm test` or `pnpm quality`.

### What `pnpm quality` protects

The release gate covers observable behavior including:

- profile schema failures and optional resume/availability rendering;
- Project catalog validation, network-free module imports, enrichment fallback, archive status, and repository identity failures;
- Article metadata, heading, code-fence, link, alias-collision, series, and part validation;
- resume page rendering and the rail’s internal `/resume/` link;
- ESLint code-quality rules over TypeScript and `.astro` components;
- article and project draft exclusion from production;
- empty article states;
- Terminal command registry, shared output formatting, completion, and history behavior;
- shared route shell and canonical URLs;
- accessibility checks with axe-core;
- keyboard focus, skip link, and disclosure behavior;
- 320 CSS-pixel reflow without page-level overflow;
- reduced-motion behavior;
- built-route internal links and resources;
- unique canonical URLs, titles, and descriptions;
- one H1 per non-redirect route;
- Open Graph and Twitter metadata;
- sitemap inclusion and robots declaration;
- page-level performance budgets.

### Artifact budgets

For each generated HTML route, `scripts/check-artifact.ts` enforces:

| Budget | Maximum |
| --- | --- |
| Gzipped JavaScript | 40 KiB |
| Gzipped CSS | 50 KiB |
| Gzipped fonts | 100 KiB |
| Gzipped initial HTML plus first-party resources | 500 KiB |
| Initial first-party resources | 20 |
| Individual image, including every responsive `srcset` variant | 200 KiB uncompressed file size |

The font budget covers the self-hosted Adwaita Sans and JetBrains Mono subsets; browsers fetch only the subsets a page actually uses. Do not “fix” a budget failure by raising the threshold without understanding the regression. Optimize or remove the new payload first.

### Lighthouse review

`pnpm lighthouse` measures `/`, `/projects/`, and `/articles/`, plus the newest published article route, three times each, and uses the median.

It marks a route for review when any target is missed:

| Metric | Target |
| --- | --- |
| Performance score | At least 90 |
| Largest Contentful Paint | At most 2500 ms |
| Cumulative Layout Shift | At most 0.1 |
| Total Blocking Time | At most 200 ms |

The summary is written to `artifacts/lighthouse-summary.json`. Lighthouse is a review tool and is not part of `pnpm quality` or the deployment workflow.

## 10. Hosting and deployment

### Current deployment flow

The `.github/workflows/site.yml` workflow runs only on pushes to `main`. It is deliberately minimal because quality is already enforced locally:

1. checks out the repository;
2. installs pnpm 11.24.0 and Node.js 24 through `pnpm/setup` with store caching;
3. installs dependencies with a frozen lockfile;
4. builds the site with `pnpm build`, mapping the Giscus repository variables into the environment;
5. uploads `dist/` and deploys it through GitHub Pages using GitHub’s OIDC-based Pages permissions.

There is no test job, no pull-request build, and no gate in CI. The pre-commit hook is the gate; this workflow is only the delivery mechanism. A concurrency group scoped to the ref keeps deployments ordered.

### One-time GitHub Pages settings

If Pages must be reconfigured:

1. Open **Repository → Settings → Pages**.
2. Set the source to **GitHub Actions**.
3. Set the custom domain to `edgseu.dev`.
4. Wait for GitHub’s DNS check to pass.
5. Enable **Enforce HTTPS** when GitHub makes it available.
6. Keep `public/CNAME` committed so the generated artifact contains the domain declaration.

### DNS responsibility

DNS is managed outside this repository. `public/CNAME` does not create DNS records; it only tells GitHub Pages which custom domain the artifact expects.

For `edgseu.dev`, the DNS provider must contain the current GitHub Pages records for an apex domain. Use GitHub’s current “Managing a custom domain for your GitHub Pages site” documentation when recreating those records rather than copying old IP addresses from memory. Also consider GitHub’s domain-verification TXT record to reduce takeover risk.

Keep the DNS provider name, account recovery method, registrar renewal status, and domain-verification record in your password manager or infrastructure inventory. They cannot be recovered from this repository.

### Normal release

1. Make the change and commit; the pre-commit hook runs the full gate and blocks bad commits.
2. Push to `main` (or push a branch and merge it; merging is a fast-forward the hook already gated).
3. Let the deploy workflow build and publish.
4. Open the production route and verify the expected content.
5. For a new article, verify its sitemap entry and discussion section.

Do not upload files to GitHub Pages manually. The deployed artifact should always be reproducible from `main`.

### Rollback

Use a revert rather than editing generated files:

```bash
git switch main
git pull --ff-only
git revert <bad-commit-sha>
git push origin main
```

The revert commit re-runs the pre-commit gate, and the push deploys the reverted state. If the bad change came through a pull request, GitHub’s **Revert** button can create the equivalent revert branch and pull request.

For an urgent content-only withdrawal:

- set an article to `Draft`; or
- set a project to `Draft`.

Then commit and deploy normally. Be aware that withdrawing a published article removes its production route and aliases, so existing external links will return 404 after deployment.

### Deployment failure triage

1. Open the failed `Site` workflow and identify which step failed: install, build, upload, or deploy.
2. If the build failed, reproduce with `pnpm build` locally. Because the pre-commit gate passed on commit, a build failure here usually means an environment difference, such as missing Giscus variables shifting the build or a broken lockfile.
3. If upload or deploy failed after the build passed, check GitHub Pages status, repository Pages settings, and workflow permissions before changing application code.
4. Push the fix to the same branch or revert the offending commit.

## 11. Scheduled and dependency management

### External link review

`.github/workflows/external-links.yml` runs at 06:17 UTC on the first day of each month and can also be started manually with **Run workflow**.

It checks:

- GitHub profile URL;
- LinkedIn profile URL;
- resume URL when configured;
- every published project repository URL.

The check follows redirects and uses a 15-second timeout per URL. A broken destination fails the workflow run so the failure is visible in the Actions tab; open the logs and fix, replace, or intentionally remove stale destinations, then re-run or let the next scheduled run confirm the repair.

### Dependabot

`.github/dependabot.yml` checks monthly for:

- npm/pnpm dependency updates;
- GitHub Actions updates.

Updates are grouped to reduce pull-request noise, with at most one open pull request per ecosystem. TypeScript and `@types/node` major updates are ignored because Node and TypeScript majors are deliberate compatibility decisions.

For each dependency pull request:

1. read the release notes for breaking changes;
2. verify the lockfile changed as expected;
3. merge locally or check out the branch and commit (or run `pnpm quality` directly) so the gate runs on your machine;
4. run `pnpm lighthouse` for framework, styling, rendering, browser, or large dependency changes;
5. inspect representative pages before merging.

Do not hand-edit `pnpm-lock.yaml`. Change dependency versions in `package.json` and let pnpm update the lockfile.

## 12. Environment variables and test hooks

| Variable | Normal use | Behavior |
| --- | --- | --- |
| `PUBLIC_GISCUS_REPO_ID` | Local/deployment comments | Enables Giscus when paired with the category ID. Exposed to browser code by design. |
| `PUBLIC_GISCUS_CATEGORY_ID` | Local/deployment comments | Enables Giscus when paired with the repository ID. |
| `GITHUB_ENRICHMENT=off` | Offline local build | Skips GitHub API enrichment but keeps curated projects. |
| `GITHUB_TOKEN=<token>` or `GH_TOKEN=<token>` | Authenticated GitHub enrichment | Raises API limits for reliable repository dates and language totals. GitHub Actions supplies `GITHUB_TOKEN`; never commit a token. |
| `GITHUB_ENRICHMENT_FILE=<file>` | Fixture or integration build | Supplies deterministic GitHub responses without network requests. |
| `METADATA_FILE=<file>` | Automated tests | Validates and builds from an alternate metadata file. |
| `BIO_FILE=<file>` | Automated tests | Validates and builds from an alternate bio file. |
| `PROJECTS_FILE=<file>` | Automated tests | Validates and builds from an alternate projects catalog file. |
| `ARTICLE_ROOT=<directory>` | Automated tests | Runs content validation against alternate article fixtures. |
| `EMPTY_ARTICLES=1` | Automated tests | Forces the published article collection empty. |
| `DIST_DIR=<directory>` | Artifact checking | Points `check-artifact.ts` at a non-default build directory. |

Except for Giscus IDs, the optional GitHub token, and the explicit offline enrichment switch, treat these as test and troubleshooting hooks rather than everyday site configuration.

`.env` and `.env.*` are ignored by Git, except a future `.env.example`. Never commit credentials. Variables beginning with `PUBLIC_` are exposed to client-side code and must never contain secrets.

## 13. Troubleshooting guide

### A commit runs without the quality gate

`core.hooksPath` is probably unset in that clone. Run `git config core.hooksPath .githooks`, and if unchecked content already reached `main`, run `pnpm quality` immediately and fix or revert before deploying.

### A draft article is missing locally

- Use `pnpm dev`, not `pnpm preview`.
- Confirm the folder contains `index.md`.
- Confirm the folder is directly below `src/content/articles/`.
- Confirm the folder name is lowercase kebab-case.
- Restart the development server after creating a new article folder if Astro did not detect it.
- Run `pnpm validate` for the exact content error.

### A draft article appeared in production

The production loader filters drafts. Confirm the deployed workflow built the current commit rather than serving a development server or stale artifact. Check the article’s `state` capitalization and the GitHub Pages deployment commit.

### A project is missing

- Confirm `state: 'Published'`.
- Confirm the entry exists inside `src/content/projects.yaml`.
- Run `pnpm check` for validation and schema errors.
- Check whether another pinned project changed the homepage selection.
- Inspect `/projects/`; the homepage intentionally shows only two to four projects.

### A project build fails with repository unavailable or moved

Check all of these:

```text
id == GitHub repository name
url == https://github.com/<owner>/<id>
repository visibility == public
```

If the repository was intentionally renamed or moved, update `id` and `url` in `src/content/projects.yaml`.

### Project language or last-pushed metadata is absent

The GitHub API request may have timed out or returned 403, 429, or 5xx. This is an intentional graceful fallback. The curated project still renders. Retry later if you need to inspect enrichment, but do not add fake local metadata.

### Comments do not load

- Confirm both Giscus variables exist in the environment that built the site.
- In deployment, confirm the repository variables use names without the `PUBLIC_` prefix; the workflow maps them.
- Confirm Discussions, the Giscus app, category, and IDs.
- Scroll near the discussion section or press **Load comments**.
- Check whether a privacy extension or network policy blocks `giscus.app`.
- The fallback GitHub Discussions link should still work even when embedding fails.

### The pre-commit hook fails

Read the first concrete validation, test, or artifact error; later failures are usually consequences. Fix the content or code, not the hook. To commit unrelated work while investigating, use `git commit --no-verify` deliberately, run `pnpm quality` before pushing, and never push output from a bypassed gate without that check.

### `pnpm test:e2e` says preview cannot start

Build first:

```bash
pnpm build
pnpm test:e2e
```

Also check whether another process occupies port 4321. Playwright reuses an existing server at that URL during local runs (the deployment workflow builds fresh), so an unrelated or stale local server can produce confusing results.

### Content validation rejects an article image

Use a relative image path from `index.md`, verify the file exists, and use one of `.png`, `.jpg`, `.jpeg`, `.webp`, or `.svg`. Add meaningful alt text. Do not use an article image path such as `/images/example.avif`; that conflicts with the article validator’s route and format rules.

### Content validation rejects a code fence

Add an allowlisted language after the opening backticks. Use `text` for output or language-neutral examples. If adding a title, use one quoted string only:

````markdown
```text "example output"
hello
```
````

### The production page is stale after deployment

1. Confirm the deploy workflow completed and references the expected commit.
2. Open the exact canonical URL with its trailing slash.
3. Hard-refresh once or use a private window to rule out browser cache.
4. Inspect the workflow’s environment URL.
5. If GitHub Pages deployed successfully but the domain fails, check Pages status and DNS rather than rebuilding repeatedly.

### The custom domain or HTTPS fails

- Confirm `public/CNAME` contains only `edgseu.dev`.
- Confirm GitHub Pages still lists the custom domain.
- Confirm DNS records match GitHub’s current documentation.
- Confirm the domain registration has not expired.
- Wait for DNS propagation and certificate issuance after a DNS change.
- Do not disable HTTPS as a permanent workaround.

## 14. Routine maintenance checklists

### Small profile or copy edit
- [ ] Edit `src/content/metadata.yaml`, `src/content/bio.md`, or `src/content/resume.md`.
- [ ] Run `pnpm validate`.
- [ ] Inspect the affected section through `pnpm dev`.
- [ ] Commit so the pre-commit gate runs `pnpm quality`.
- [ ] Verify production after deployment.

### New project

- [ ] Public GitHub repository exists.
- [ ] `id`, repository name, and URL match.
- [ ] Summary is plain text and at most 240 characters.
- [ ] One to six unique tags.
- [ ] Unique integer order.
- [ ] Lifecycle is accurate.
- [ ] Pin choice is deliberate and total published pins remain at most four.
- [ ] `pnpm validate` passes.
- [ ] Homepage and projects page look correct.
- [ ] Committed with the hook running `pnpm quality` under normal enrichment.

### New article

- [ ] Folder is lowercase kebab-case and contains `index.md`.
- [ ] Draft has no `publishedAt` or `revisedAt`.
- [ ] Title and summary are plain text and unique.
- [ ] Body starts at H2 and does not skip heading levels.
- [ ] Code fences have allowlisted languages.
- [ ] Images exist, are optimized, and have correct alt text.
- [ ] Internal and important external links work.
- [ ] Draft preview checked in both themes and at narrow width.
- [ ] Published state has a real, non-future publication date.
- [ ] Pin total remains at most two.
- [ ] Commit runs the gate successfully.
- [ ] Production route, sitemap, and discussion section verified after deployment.

### Monthly maintenance

- [ ] Review the external-link workflow logs.
- [ ] Review any Dependabot pull request and release notes.
- [ ] Check the resume page, PDF destination, and contact links manually.
- [ ] Check whether project lifecycle labels still reflect reality.
- [ ] Check GitHub Pages and domain renewal status.
- [ ] Review open article discussions and moderation needs.

### Before a structural or dependency release

- [ ] `pnpm quality` passes.
- [ ] `pnpm lighthouse` has no unexplained regression.
- [ ] Homepage, projects, article index, resume page, and a full article checked locally.
- [ ] Light theme, dark theme, keyboard navigation, and 320 px layout checked.
- [ ] Production preview contains no drafts.
- [ ] Generated sitemap and robots policy checked.

## 15. Rules of thumb

- Edit source files, never generated output.
- Keep `core.hooksPath` set; the pre-commit hook is the only quality gate.
- Use `Draft` as the publication control; do not hide content with CSS.
- Keep project curation local and GitHub metadata supplemental.
- Keep article Markdown portable: no raw HTML or MDX.
- Preserve trailing slashes in internal routes.
- Prefer an article alias when renaming published content.
- Treat pinning as an editorial exception, not a default.
- Run `pnpm validate` early; trust the pre-commit gate for release.
- Deploy only by pushing `main`; the workflow builds and publishes whatever landed there.
- Roll back with a Git revert, not a manual Pages upload.
- Do not put secrets in `PUBLIC_` environment variables.
- When a domain, repository owner, discussion category, or canonical URL changes, expect coordinated updates in code, GitHub settings, and external infrastructure.

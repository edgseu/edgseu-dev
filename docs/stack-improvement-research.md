# Stack & Workflow Improvement Research

An evidence-backed audit of the `edgseu.dev` architecture and workflow against the current official documentation (docs.astro.build, official package READMEs, GitHub Actions docs, Playwright docs), conducted 2026-09-03 against Astro 7.2.9 / TypeScript 6.0.3 / Playwright 1.62.1 / Zod 4.5.4 / pnpm 11.24.0 / Node 24 as pinned in `package.json`.

**Scope.** This document answers eight concrete questions: (1) whether the Astro Content Layer can replace the hand-rolled `import.meta.glob` + `gray-matter` + split `metadata.yaml` pipeline, (2) whether `@astrojs/rss` and `@astrojs/sitemap` should replace the custom endpoints, (3) what Astro 7 / 7.x delivers and what the repo already uses, (4) whether `astro:assets` image optimization applies to the committed article images, (5) the current testing-stack recommendation (Vitest vs node:test+tsx, Playwright config details), (6) linting/formatting for `.astro` files, (7) GitHub Actions workflow modernization, and (8) miscellaneous platform features (prefetch, fonts, HTML compression, CSP). Every non-obvious claim links to the primary source that owns it. Where the repo's approach is already equal to or better than the official path, that is stated explicitly — several of the repo's quality gates are unusual and worth keeping.

---

## 1. Content Collections / Content Layer API vs the hand-rolled pipeline

### What the official recommendation is

The [Content Collections guide](https://docs.astro.build/en/guides/content-collections/) states that content collections are "the best way to manage sets of content in any Astro project." For a directory of local Markdown articles the official path is a `src/content.config.ts` file defining a collection with the [glob() loader](https://docs.astro.build/en/reference/content-loader-reference/#glob-loader) (`loader: glob({ pattern: '**/index.md', base: './src/content/articles' })`) plus an optional-but-recommended [Zod schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema) imported from `astro/zod` (a re-export that "supports all of the features of Zod 4", i.e. the same major version the repo already uses). Querying is via `getCollection()` / `getEntry()`, rendering via `render()` from `astro:content`, which returns a `<Content />` component and the rendered headings list — the equivalents of the repo's `markdown.Content` / `markdown.getHeadings()` from `import.meta.glob`.

What collections provide for free that the repo hand-rolls:

- **Type-safe schema**: automatic TypeScript types and editor autocomplete from the Zod schema ([Defining the collection schema](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema)). The repo's `ArticleFrontmatter`/`ParsedArticle` interfaces provide the same types, but they are asserted by hand in `src/lib/articles.ts` rather than derived from a schema.
- **Build-time validation with helpful errors**: schema violations surface with a file-level error at build time ([ibid.](https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema)).
- **Draft handling**: there is no built-in draft flag; the standard pattern is a schema field plus a `filter` on `getCollection()`. The repo's `state: 'Draft' | 'Published'` + `visibleArticles(isDev)` approach maps directly onto this and is, if anything, stricter (drafts must not declare `publishedAt`/`revisedAt`).
- **Image handling**: local images referenced from Markdown inside `src/` are processed by `astro:assets` regardless of collections (see §4), so nothing is lost or gained here.
- **Persistent content-layer data store**, cached between builds, scaling to tens of thousands of entries ([Types of collections](https://docs.astro.build/en/guides/content-collections/#types-of-collections)) — irrelevant at 7 articles.
- **Editor Intellisense** via the [`contentIntellisense` experimental flag](https://docs.astro.build/en/reference/experimental-flags/content-intellisense/) — a genuine DX win the hand-rolled approach cannot match.

### The split `metadata.yaml` + `index.md` constraint

The glob() loader reads **frontmatter only**; it has no support for a per-directory sidecar `metadata.yaml`. Migrating as-is requires either:

1. **Inlining metadata into frontmatter** — a one-time mechanical change to 7 article folders, after which `glob({ pattern: '*/index.md' })` works directly; or
2. **A custom build-time loader** via the [Content Loader API](https://docs.astro.build/en/reference/content-loader-reference/): a ~40-line loader that globs `*/index.md`, reads the sibling `metadata.yaml`, and calls `store.set()` per entry — this preserves the existing content layout exactly while gaining the collection APIs.

### Verdict: the repo's pipeline is a superset for its own rules — migration is optional, not obviously better

The repo's `parseAndValidateArticle()` enforces rules that no Zod schema can express and that Content Collections do not provide: heading-level-skip and duplicate-anchor detection, a code-fence language allowlist, raw-HTML rejection, local link/image existence checks, cross-article constraints (published→draft link rejection, alias/redirect route collision checks, max 2 pinned articles, no future dates). The official docs only promise schema-level validation of individual entries ([When to create a collection](https://docs.astro.build/en/guides/content-collections/#when-to-create-a-collection)). A migration would still need this code post-`getCollection()`, plus a custom loader to keep the split layout — i.e. the hand-rolled module would shrink but not disappear, and the split-directory constraint would introduce new code.

**Recommendation**: keep the current pipeline for now. If editor autocomplete inside `metadata.yaml` becomes valuable, prefer a custom loader (option 2) over inlining frontmatter, since the layout also powers the e2e draft-preview and validation tests.

Sources: [Content Collections guide](https://docs.astro.build/en/guides/content-collections/), [Content Loader API](https://docs.astro.build/en/reference/content-loader-reference/), [astro:content reference](https://docs.astro.build/en/reference/modules/astro-content/)

---

## 2. `@astrojs/rss` and `@astrojs/sitemap`

### Current versions and features

- [`@astrojs/rss` 4.0.19](https://www.npmjs.com/package/@astrojs/rss) — official helper `rss()` for building feeds inside a `.xml.ts` [endpoint](https://docs.astro.build/en/recipes/rss/); handles XML escaping, `site` resolution from `context.site`, optional `customData` (e.g. `<language>`), `trailingSlash` handling, and an optional [`rssSchema`](https://docs.astro.build/en/recipes/rss/#using-content-collections) Zod schema to guarantee every entry produces a valid feed item.
- [`@astrojs/sitemap` 3.7.4](https://www.npmjs.com/package/@astrojs/sitemap) — official [integration](https://docs.astro.build/en/guides/integrations-guide/sitemap/) that crawls prerendered routes and emits `sitemap-index.xml` + numbered `sitemap-N.xml` files; per-page `lastmod` is possible only through the [`serialize()`](https://docs.astro.build/en/guides/integrations-guide/sitemap/#serialize) hook, because the integration "can't analyze a given page's source code" and only offers site-wide defaults otherwise. `changefreq` and `priority` are explicitly noted as ignored by Google.

### How this applies to the repo

- **RSS**: the hand-rolled `src/pages/rss.xml.ts` (~55 lines) already does correct escaping and produces RSS 2.0 + Atom self-link. Switching buys maintenance and correctness guarantees for free but changes nothing user-visible. If the feed ever needs `content` (full-post feeds), [`@astrojs/rss` supports it](https://docs.astro.build/en/recipes/rss/#including-full-post-content) and hand-rolling that correctly is non-trivial. Either choice is defensible; the custom one is tested and small.
- **Sitemap**: the repo's custom `sitemap.xml.ts` emits **one file with per-article `lastmod`** derived from `revisedAt`/`publishedAt` — the official integration cannot infer per-article dates automatically. Switching also has a hidden cost: the integration writes `sitemap-index.xml` + `sitemap-0.xml`, which would break `scripts/check-artifact.ts`'s hard expectations that `dist/sitemap.xml` exists, that every canonical appears in `<loc>` within it, and that `robots.txt` declares `Sitemap: <site>/sitemap.xml`. The custom endpoint is better-tailored to this repo's quality gate.

**Recommendation**: keep both custom endpoints; they are smaller than the migration risk and are backed by the artifact gate. Revisit `@astrojs/rss` only if full-content feeds are wanted.

Sources: [RSS recipe](https://docs.astro.build/en/recipes/rss/), [Sitemap integration guide](https://docs.astro.build/en/guides/integrations-guide/sitemap/)

---

## 3. Astro 7 status and notable features

[Astro 7.0 shipped June 22, 2026](https://astro.build/blog/astro-7/); 7.2.10 is the latest release ([changelog](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md)), so the repo at 7.2.9 is one patch behind. Headline items from the [v7 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/) and blog:

| Feature | Status | Relevance to this repo |
| :--- | :--- | :--- |
| **Vite 8 + Rolldown** | Stable in 7.0 | Inherited automatically; the `@tailwindcss/vite` plugin is the only Vite plugin in use. |
| **Rust compiler** (replaces the Go compiler) | Default in 7.0 | Unclosed tags now error and invalid HTML is no longer auto-corrected. The repo builds cleanly on 7.2.9, so it already complies. |
| **Sätteri Markdown pipeline** (Rust, [pulldown-cmark](https://github.com/pulldown-cmark/pulldown-cmark)-based) | Default in 7.0; unified pipeline opt-in via `@astrojs/markdown-remark` | The repo explicitly opts into `unified()` with a custom rehype plugin, which remains fully supported ([upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-markdown-processor-sätteri)). Porting the `rehypeArticleEnhancements` plugin to [Sätteri's plugin API](https://satteri.bruits.org/docs/plugins/) would drop `@astrojs/markdown-remark` and speed up builds — a 7-article site gains little, so this is a "when convenient" item. |
| **Queued rendering** | Stable, default in 7.0 | No action; already default. |
| **Advanced routing / `src/fetch.ts` reserved name** | Stable in 7.0 | The repo has no `src/fetch.ts` (only `src/lib/*.ts`), so the reserved name is not a hazard. SSR-only feature; irrelevant for static output. |
| **Route caching + CDN cache providers** | Stable in 7.0 (cache), experimental providers | Prerendered static output never hits the cache path — not applicable. |
| **Experimental flags promoted to stable** | `logger`, `queuedRendering`, `rustCompiler`, `advancedRouting`, `cache` ([upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/#experimental-features-now-stable)) | The repo uses none of the old flags; nothing to remove. |
| **`compressHTML` default changed `true` → `'jsx'`** | 7.0 ([config reference](https://docs.astro.build/en/reference/configuration-reference/#compresshtml)) | Whitespace between inline elements is now stripped JSX-style; spaces must be written explicitly as `{" "}`. Worth a one-time visual pass over the shell/terminal UI, which is whitespace-sensitive. The passing artifact gate suggests it already renders correctly. |
| **Server islands / on-demand rendering** | Stable, SSR-only | Not applicable to `output: 'static'`. |
| **View transitions** | Stable ([guide](https://docs.astro.build/en/guides/view-transitions/)) | Optional; the terminal shell is a single-page interaction, and article navigation is plain MPA links. Could smooth article↔index navigation but adds a client script against the 40 KiB JS budget. |
| **Background dev/preview server, JSON logging, agent detection** | 7.0 / 7.2.0 (`astro preview --background`, [changelog](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md)) | Directly useful for this repo's agent-driven workflow (`pnpm astro preview` already runs behind Playwright's `webServer`). |
| **glob loader `deferRender`** | 7.1.0 ([changelog](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md)) | Memory optimization for large Markdown collections — not needed at this scale. |
| **CSP config with fine-grained directive `kind`** | 7.1.0 ([changelog](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md)) | Astro's built-in [CSP configuration](https://docs.astro.build/en/reference/configuration-reference/#securitycsp) could complement this security-focused portfolio; inline Shiki styles and the copy-code button would need allowlisting. Underrated, zero-dependency hardening. |
| **`astro check`** | Requires the `@astrojs/check` package explicitly ([repo already has 0.9.10, the current version](https://www.npmjs.com/package/@astrojs/check)); "intended to be used in CI workflows" ([CLI reference](https://docs.astro.build/en/reference/cli-reference/#astro-check)) | The repo's `pnpm check` already matches current guidance. No documented `astro check` performance claim was found in the official 7.x release notes; that item remains unverified. |

Sources: [Astro 7.0 blog post](https://astro.build/blog/astro-7/), [Upgrade to v7](https://docs.astro.build/en/guides/upgrade-to/v7/), [Astro changelog](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md)

---

## 4. Image optimization (`astro:assets`, sharp, responsive images)

**Finding: the repo already benefits from `astro:assets` — a non-obvious, verifiable fact.** The article images in `src/content/articles/kvm-windows-optimization/images/*.webp` are referenced with standard Markdown `![alt](./images/…)` syntax inside `src/`. Per the [Images guide](https://docs.astro.build/en/guides/images/#images-in-markdown-files): "Use standard Markdown ![alt](src) syntax in your .md files. Your local images stored in src/ and remote images will be processed and optimized." The built output confirms this: `dist/_astro/` contains hashed, sharp-processed images, and the article HTML carries `loading="lazy"`, `decoding="async"`, and inferred `width`/`height` (CLS protection) — exactly the [documented `<Image />`-equivalent Markdown output](https://docs.astro.build/en/guides/images/#image-). sharp is already a direct dependency (0.35.4) and is the [default image service](https://docs.astro.build/en/guides/images/#default-image-service).

**The remaining gap is responsive `srcset`.** The built images have no `srcset` because [`image.layout` defaults to `undefined`](https://docs.astro.build/en/reference/configuration-reference/#imagelayout) (stable since `astro@5.10.0`). The source screenshots are 1168×701 while a typical article column is well under 828px, so every mobile visitor currently downloads the full-width image. Setting:

```ts
export default defineConfig({
  image: { layout: 'constrained', responsiveStyles: true },
});
```

applies to "any local and remote images using the Markdown ![]() syntax" ([Images guide](https://docs.astro.build/en/guides/images/#responsive-image-behavior)) and generates breakpoint `srcset`/`sizes` automatically ([generated HTML](https://docs.astro.build/en/guides/images/#generated-html-output-for-responsive-images)). Two caveats from the docs: it multiplies generated files at build time ([note](https://docs.astro.build/en/guides/images/#responsive-image-behavior)), and `responsiveStyles: true` applies global styles that take precedence over Tailwind 4 rules — the docs recommend leaving it off only if you style images yourself or use Tailwind's own ([responsive images with Tailwind 4](https://docs.astro.build/en/guides/images/#responsive-images-with-tailwind-4)).

**Interaction with the quality gate**: `scripts/check-artifact.ts` enforces its 200 KiB budget on the single file referenced by `img[src]`. With `srcset`, the budget should be extended to check every candidate in the `srcset` (the largest candidate is the same processed file, so the 200 KiB source-image ceiling still applies; the meaningful new check is that each srcset candidate exists in `dist/_astro/` — broken srcset entries are otherwise silently unparsed by cheerio).

**Verdict**: the 200 KiB image budget plus committed pre-compressed webp already keeps things small (largest committed file is ~84 KiB); `image.layout` is the one genuine remaining win, mostly for mobile transfer.

Sources: [Images guide](https://docs.astro.build/en/guides/images/), [configuration reference — `image.layout`](https://docs.astro.build/en/reference/configuration-reference/#imagelayout), [`image.responsiveStyles`](https://docs.astro.build/en/reference/configuration-reference/#imageresponsivestyles)

---

## 5. Testing stack

### Unit tests: Vitest is the official recommendation; node:test + tsx is a legitimate lighter alternative

The [Astro Testing guide](https://docs.astro.build/en/guides/testing/#vitest) names **Vitest** as the unit-test framework and shows integration via `getViteConfig()` from `astro/config`, which loads the project's Astro config into the test environment. Vitest 4.1.11 is the current major (npm registry). The guide also documents component testing through the [Container API](https://docs.astro.build/en/guides/testing/#vitest-and-container-api) (`experimental_AstroContainer`), which can render `.astro` components to strings without a browser — the only unit-level way to test `src/components/*`.

The repo's `node:test` + `tsx --test` choice is not sanctioned by the Astro docs, but it is well-suited to what these tests actually do: pure-function tests over `src/lib/*.ts` (article parsing, terminal formatting, profile validation) with zero additional dependencies. `node:test` files do **not** run under Vitest unchanged — `test`/`describe` imports come from `node:test`, and while `node:assert/strict` works fine inside Vitest, the runner imports must change. Migration cost is therefore low but non-zero (rewrite import lines across `tests/*.test.ts`), and the payoff is: watch mode, coverage, container-API component tests, and alignment with the documented path.

**Recommendation**: keep node:test while tests target pure lib functions; adopt Vitest (with `getViteConfig()`) when component-level tests or coverage are wanted — not before.

### Playwright specifics

- **`reuseExistingServer`**: the [Playwright webServer docs](https://playwright.dev/docs/test-webserver) and the [Astro testing guide's example](https://docs.astro.build/en/guides/testing/#advanced-launching-a-development-web-server-during-the-tests) both use `reuseExistingServer: !process.env.CI`, documenting that the flag reuses "an existing server on the port or url when available" and that this "should be commonly set to `!process.env.CI`". The repo's `reuseExistingServer: true` means a CI run could silently reuse a stale server on port 4321 and test the wrong build. One-line fix, recommended.
- **Caching Playwright browsers** (`actions/cache` with `~/.cache/ms-playwright`): the official [CI docs](https://playwright.dev/docs/ci#custom-caching) **advise against it**: "Caching browser binaries is not recommended, since the amount of time it takes to restore the cache is comparable to the time it takes to download the binaries. Especially under Linux, operating system dependencies need to be installed, which are not cacheable." The repo's current `playwright install --with-deps chromium` per run matches the official GitHub Actions example — this task's assumption is contradicted by the primary source.
- The rest of the config (chromium-only project, `retries: 2` in CI, `github` reporter, `trace: 'retain-on-failure'`, `forbidOnly` in CI) is consistent with the [official CI guidance](https://playwright.dev/docs/ci).
- **`astro check` / `@astrojs/check`**: current guidance is that `astro check` is the CI type-check entry point and needs `@astrojs/check` installed explicitly ([TypeScript guide](https://docs.astro.build/en/guides/typescript/), [CLI reference](https://docs.astro.build/en/reference/cli-reference/#astro-check)); the repo already does this (`check` script) with the current 0.9.10.
- **Dev toolbar**: the built-in [Audit app](https://docs.astro.build/en/guides/dev-toolbar/#audit) performs quick a11y/perf audits in dev; the docs explicitly say it "is not a replacement for dedicated tools" — the repo's axe-core e2e suite is the stronger instrument and should stay.

Sources: [Astro testing guide](https://docs.astro.build/en/guides/testing/), [Playwright CI](https://playwright.dev/docs/ci), [Playwright webServer](https://playwright.dev/docs/test-webserver), [Astro TypeScript guide](https://docs.astro.build/en/guides/typescript/)

---

## 6. Linting / formatting

**Confirmed: the repo has no linter or formatter.** The root contains only `astro.config.ts`, `package.json`, `playwright.config.ts`, `pnpm-workspace.yaml`, `tsconfig.json`, `readme.md`, lockfile, and dotfiles — no ESLint, Biome, or Prettier configuration.

Current landscape for `.astro` files (all versions checked against the npm registry, 2026-09-03):

| Tool | Version | `.astro` support status | Primary source |
| :--- | :--- | :--- | :--- |
| `eslint-plugin-astro` | 3.1.0 | Purpose-built ESLint plugin for Astro components (frontmatter, template, JSX-like expressions, directives, client scripts). The README self-describes the project as "in the **_experimental stages_** of development" while noting it "works fine with a withastro/docs repository". | [README](https://github.com/ota-meshi/eslint-plugin-astro) |
| `@biomejs/biome` | 2.5.12 | Astro is listed as 🟡 experimental across parsing/formatting/linting. Since v2.3.0 Biome "supports Vue, Svelte and Astro file out of the box" for the HTML/CSS/JS parts, **but "full support is still experimental, it must be enabled explicitly"** via `html.experimentalFullSupportEnabled`, and Biome's own docs recommend disabling several rules (e.g. `useConst`, `noUnusedImports`) for `.astro` files under partial support. | [Language support](https://biomejs.dev/internals/language-support/) |
| Prettier + `prettier-plugin-astro` | 0.14.1 | Formatting only, no linting; the plugin remains the standard Prettier path for `.astro`. | [npm](https://www.npmjs.com/package/prettier-plugin-astro) |

Notably, **Astro's own docs no longer recommend any linter**: the old `guides/eslint` page returns 404 and the [Editor Setup guide](https://docs.astro.build/en/guides/editor-setup/) is silent on linting/formatting. There is no official vendor endorsement to follow — this is an ecosystem decision.

**Recommendation**: for real `.astro` linting today, `eslint-plugin-astro` is the most purpose-built option (with `@eslint/js` + typescript-eslint for `.ts`, matching the repo's strict TS posture). Biome is attractive as a single fast toolchain but its Astro support is explicitly experimental and currently requires opt-in flags plus rule overrides; its `.ts`/`.css` handling could be adopted now with `.astro` left to the plugin later. Whichever is chosen, wire it into the `quality` gate and CI.

Sources: [Biome language support](https://biomejs.dev/internals/language-support/), [eslint-plugin-astro README](https://github.com/ota-meshi/eslint-plugin-astro), [Astro editor setup](https://docs.astro.build/en/guides/editor-setup/)

---

## 7. GitHub Actions workflow

### Version currency (verified against GitHub releases API, 2026-09-03)

| Action | Repo uses | Latest | Status |
| :--- | :--- | :--- | :--- |
| `actions/checkout` | v7 | v7.0.1 | current |
| `actions/setup-node` | v7 | v7.0.0 | current |
| `pnpm/action-setup` | v6 | v6.0.10 | current, **but superseded** (below) |
| `actions/upload-pages-artifact` | v5 | v5.0.0 | current |
| `actions/deploy-pages` | v5 | v5.0.1 | current |

The repo's version pins are fully current — nothing to bump.

### `pnpm/setup` supersedes `pnpm/action-setup` (+ corepack is a dead end)

The [`pnpm/action-setup` README](https://github.com/pnpm/action-setup/blob/main/README.md) now carries a top notice: "**This action has a successor: [`pnpm/setup`](https://github.com/pnpm/setup).** For pnpm v11 and newer, use `pnpm/setup` instead. It downloads pnpm's self-contained release binary (no Node.js or npm required) and can install a JavaScript runtime (Node.js, Bun, or Deno) in the same step, replacing `actions/setup-node`." `pnpm/action-setup` "remains the action to use for installing pnpm v10 and older." Since this repo pins `pnpm@11.24.0` via `packageManager`, the two-step `pnpm/action-setup@v6` + `actions/setup-node@v7` can collapse into a single `pnpm/setup@v1` step (`version: 11`, `runtime: node@24`, `cache: true`).

Corepack is not an alternative: the [Node.js corepack docs](https://nodejs.org/api/corepack.html) state "Corepack is distributed with Node.js from version 14.19.0 up to (but not including) 25.0.0" — i.e. removed from Node 25+. The repo's `engines: >=24 <25` and explicit action-based installs are the future-proof configuration.

### Playwright browser caching: do not add it

As documented in §5, the [official Playwright CI guidance](https://playwright.dev/docs/ci#custom-caching) recommends *against* caching `~/.cache/ms-playwright`. No `actions/cache` step should be added for browsers. `actions/setup-node`'s built-in `cache: pnpm` (already in use) remains the correct dependency cache; the [`actions/cache` docs](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching) describe the underlying restore/fallback-key mechanics if a custom cache is ever needed.

### PR preview deployments for GitHub Pages: not generally available

The [`actions/deploy-pages` README](https://github.com/actions/deploy-pages#preview-deployments) documents a `preview` input ("Is this attempting to deploy a pull request as a GitHub Pages preview site?") with the explicit caveat: "**NOTE: This feature is only in alpha currently and is not available to the public!**" So per-PR preview URLs for GitHub Pages are not currently producible with the official action; the repo's existing model — full quality gate on every PR, deploy only from `main` — is the correct GA configuration. (The same README recommends protecting the `github-pages` environment, which GitHub configures by default when Pages uses Actions as source.)

### Lighthouse: custom script vs `treosh/lighthouse-ci-action`

[`treosh/lighthouse-ci-action` 12.6.2](https://github.com/treosh/lighthouse-ci-action) (latest release 2026-03-12) wraps Lighthouse CI with assertion budgets (`budgetPath`), `configPath` for `lighthouserc`, and automatic result artifacts. The repo's `scripts/run-lighthouse.ts` duplicates part of this but is fully under repo control and runs inside the same gate as the page-weight budgets. If Lighthouse assertions (not just measurement) are wanted, the action can be added as a separate CI job; otherwise the custom script is adequate.

### Other refinements

- **Concurrency**: the workflow pins `group: pages` with `cancel-in-progress: false` — correct for the deploy job's serialization, but the *validate* job also runs on every PR; scoping the group to `github.workflow`-`github.ref` with `cancel-in-progress` for non-`main` refs would cancel superseded PR builds (documented under `concurrency` in the [workflow syntax reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#concurrency)).
- **Artifact attestation**: [`actions/attest-build-provenance@v4`](https://github.com/actions/attest-build-provenance) (v4.2.2) generates SLSA-style provenance for built artifacts and requires `permissions: id-token: write` ([GitHub docs on artifact attestations](https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds)). For a public static site this is low value (the site is served, not distributed), but it is a one-step addition if the `dist` artifact were ever published as a release asset.

Sources: [pnpm/action-setup README](https://github.com/pnpm/action-setup/blob/main/README.md), [Node.js corepack docs](https://nodejs.org/api/corepack.html), [actions/deploy-pages README](https://github.com/actions/deploy-pages#readme), [Playwright CI docs](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching), [GitHub artifact attestations](https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds), [Astro GitHub Pages guide](https://docs.astro.build/en/guides/deploy/github/)

---

## 8. Miscellaneous platform features

- **Prefetch**: Astro's [prefetch guide](https://docs.astro.build/en/guides/prefetch/) enables background fetching of hovered links via `prefetch` config + `data-astro-prefetch` on `<a>` elements (default strategy `hover`). Cheap for a static MPA; costs one small script from the 40 KiB JS budget. A reasonable, low-risk navigation improvement for the article index → article path.
- **Fonts**: the site currently ships **zero web fonts** — `src/styles/global.css` declares `--font-sans`/`--font-mono` as system-font stacks with no `@font-face`, consuming 0 bytes of the 100 KiB font budget. Astro's [Fonts API](https://docs.astro.build/en/guides/fonts/) (stable top-level `fonts` config with `<Font />` component, preload support, and built-in Fontsource/Google providers) is the official way to add brand fonts later, with "preload links, optimized fallbacks" handled automatically. No action needed today; adopting Geist via the Fontsource provider would be the idiomatic route if brand fidelity ever demands it.
- **`compressHTML: 'jsx'` whitespace** (7.0 default): one-time visual audit of inline-element spacing in components, per the [upgrade guide's instruction](https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-whitespace-handling-compresshtml-jsx) to add explicit `{" "}` where JSX rules strip a visible space. The terminal output formatting in `src/lib/terminal.ts` is unaffected (it builds strings in TS), but `.astro` templates should be spot-checked.
- **SVG optimization** ([experimental flag](https://docs.astro.build/en/reference/experimental-flags/svg-optimization/)): available if the inline SVG copy-button were ever moved to an asset; not needed now.
- **Incremental builds** ([experimental flag](https://docs.astro.build/en/reference/experimental-flags/incremental-build/)): would cut CI build time as content grows; worth tracking but experimental and unnecessary at 7 articles.
- **Dev toolbar**: enabled by default in dev with useful [built-in apps](https://docs.astro.build/en/guides/dev-toolbar/); nothing to configure.

---

## Recommended improvements, prioritized

| Priority | Change | Why | Primary source |
| :--- | :--- | :--- | :--- |
| **1** | Set `reuseExistingServer: !process.env.CI` in `playwright.config.ts` | Prevents CI from silently testing a stale server on port 4321; the docs' canonical value is `!process.env.CI`. One line. | [Playwright webServer](https://playwright.dev/docs/test-webserver) |
| **2** | Add a linter: `eslint-plugin-astro` + typescript-eslint (optionally Biome 2.x for TS/CSS, with `html.experimentalFullSupportEnabled` off for `.astro`) | The repo has zero lint/format tooling; `.astro` templates are unchecked by `tsc`/`astro check` for code-quality issues. Wire into the `quality` gate. | [eslint-plugin-astro](https://github.com/ota-meshi/eslint-plugin-astro), [Biome language support](https://biomejs.dev/internals/language-support/) |
| **3** | Enable `image: { layout: 'constrained', responsiveStyles: true }` and extend `check-artifact.ts` to verify `srcset` candidates | Generates responsive `srcset` for all Markdown article images (mobile transfer win at 1168px-wide screenshots); the gate must then check every srcset candidate. | [Images guide](https://docs.astro.build/en/guides/images/#responsive-image-behavior), [`image.layout`](https://docs.astro.build/en/reference/configuration-reference/#imagelayout) |
| **4** | Migrate `pnpm/action-setup@v6` + `setup-node@v7` → `pnpm/setup@v1` (`runtime: node@24`, `cache: true`) | `pnpm/action-setup` is formally superseded for pnpm 11+; `pnpm/setup` installs pnpm 11's standalone binary and Node in one step. | [pnpm/action-setup README](https://github.com/pnpm/action-setup/blob/main/README.md) |
| **5** | Do **not** add Playwright browser caching; keep per-run `playwright install --with-deps chromium` | Official docs advise against caching browser binaries (restore time ≈ download time, OS deps uncacheable). Confirms current setup. | [Playwright CI](https://playwright.dev/docs/ci#custom-caching) |
| **6** | One-time `compressHTML: 'jsx'` whitespace audit of `.astro` inline elements; add `{" "}` where spacing collapsed | v7 changed the default whitespace rules; the artifact gate can't catch visual regressions. | [Upgrade to v7](https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-whitespace-handling-compresshtml-jsx) |
| **7** | Scope the `concurrency` group per ref and cancel superseded PR builds | Current `group: pages, cancel-in-progress: false` serializes PR validation needlessly. | [Workflow syntax — concurrency](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#concurrency) |
| **8** | Evaluate Astro CSP config (`security.csp`) for the static site | Zero-dependency hardening aligned with the site's security focus; inline Shiki styles and the copy-code button need allowlisting. | [Astro changelog 7.1.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md), [config reference](https://docs.astro.build/en/reference/configuration-reference/#securitycsp) |
| **9** | Adopt Vitest (`getViteConfig()`) only when component tests or coverage are needed | node:test + tsx remains adequate for pure-logic tests; Vitest is the documented path for Container-API component tests. | [Astro testing guide](https://docs.astro.build/en/guides/testing/#vitest) |
| **10** | Enable `prefetch` + `data-astro-prefetch` on article-index links | Official, tiny navigation win for a static MPA; watch the 40 KiB JS budget. | [Prefetch guide](https://docs.astro.build/en/guides/prefetch/) |
| **11** | Consider porting `rehypeArticleEnhancements` to Sätteri and dropping `@astrojs/markdown-remark` | v7's default pipeline is faster; the unified pipeline remains fully supported, so this is convenience, not necessity. | [Upgrade to v7 — Sätteri](https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-markdown-processor-sätteri) |
| **12** | Keep: hand-rolled articles pipeline, custom RSS/sitemap endpoints, per-run browser install, custom Lighthouse script, current action pins | All verified equal-or-better than the official path for this repo's constraints (split metadata layout, per-article `lastmod`, `sitemap.xml` gate expectations, current action versions). | See §1, §2, §5, §7 |

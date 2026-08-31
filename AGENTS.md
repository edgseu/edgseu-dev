# AGENTS.md

## Mission and sources of truth

Build and operate `edgseu.dev` as a fast, accessible, recruiter-first static Site for Aman Bhushan Singh’s Cloud and DevSecOps work.

Read these sources before changing the corresponding area:

- **Domain language or product boundaries:** `CONTEXT.md`. Preserve its distinctions between Site, GitHub Profile, Homepage, Project Lifecycle, Project Publication State, Article, and First Release.
- **Original First Release specification:** GitHub issues `h1zardian/edgseu-dev#17` through `#28`. Read the parent and the affected child ticket before implementation; acceptance criteria are load-bearing.
- **Deployment, DNS, Giscus, rollback, and owner duties:** `docs/operations.md`.
- **Browser, accessibility, performance, and launch status:** `docs/release-evidence.md`. Do not report a pending row as verified.
- **Executable toolchain and commands:** `package.json`, `astro.config.ts`, `playwright.config.ts`, and `.github/workflows/`.

## Skill routing

Use the project workflow skills when their trigger applies:

- **`/implement`:** implementing a ticket or specification. Complete the behavior, verification, review, and requested commit.
- **`/tdd`:** permanent behavior changes and bug fixes where the ticket already establishes a public seam. Work vertically: one red observable contract, minimal implementation, then the next contract.
- **`/context-mode`:** tests, builds, logs, diffs, dependency output, API responses, Lighthouse output, or any command that may exceed a few lines. Print only the relevant summary.
- **`/diagnosing-bugs`:** hard failures or regressions. Establish a tight red-capable reproduction before forming hypotheses; preserve the reproduction as a regression test at the correct seam.
- **`/code-review`:** after implementation and before commit. Pin the fixed point and review Standards and Spec in parallel. Address findings, then run the final gate.
- **`/writing-for-agents`:** changes to this file, `CLAUDE.md`, or agent skills. Keep pointers sharp and avoid duplicating facts already discoverable from configuration.

## Architecture invariants

- Astro static output only. No backend, database, CMS runtime, authentication, client-rendering framework, or site-wide hydration layer.
- HTML, CSS, canonical URLs, and ordinary links are the complete baseline. JavaScript may enhance theme, disclosures, terminal behavior, Article navigation/copy, and Giscus; it must not own content, routing, or primary navigation.
- Use focused vanilla TypeScript and the semantic token layer in `src/styles/global.css`. Keep the Muted repository hierarchy: flat bordered surfaces, modest corners, muted cyan primary accent, restrained violet secondary accent, system sans/monospace stacks.
- Shared shell behavior belongs in `src/layouts/BaseLayout.astro` and `src/components/Header.astro`. Canonical public routes are `/`, `/projects/`, `/articles/`, and `/articles/<slug>/` with trailing slashes.
- The first focusable element is the skip link. Disclosures use native buttons, accurate `aria-expanded`/`aria-controls`, Escape close with focus return, destination close, and outside activation without focus theft. Global Menu and mobile Article outline remain mutually exclusive.
- First visit is dark. Persist only an explicit theme choice and apply it before paint. Reduced motion removes optional movement without removing feedback.
- Every public template must reflow at 320 CSS pixels and remain useful at 200% zoom and with JavaScript disabled. Tables and code scroll internally; the page does not overflow horizontally.

## Content model

### Site and editorial claims

`src/data/site.ts` owns approved identity destinations and factual profile data. A résumé action exists only after the owner supplies and approves a valid destination.

Treat Homepage prose, Project display copy/lifecycle values, and Published Articles as editorial claims requiring explicit owner approval. A file being present or marked `Published` is not evidence of approval. Never derive final prose from a prototype or copy a repository README without separate approval.

### Projects

- `src/data/projects.ts` is the curated authority for selection, title, summary, lifecycle, publication, tags, URL, and explicit order.
- `src/lib/projects.ts` may enrich a build with public GitHub language, pushed date, and repository truth. Network failure omits optional enrichment; a confirmed dead/private/moved Published repository fails production; GitHub archive truth forces `Archived`.
- Browser visitors never call GitHub APIs. Project Cards link directly to public GitHub repositories; there are no on-site Project detail routes.

### Articles

- One Article per lowercase kebab-case folder: `src/content/articles/<slug>/index.md`. Keep local assets beside the source.
- Drafts render at eventual routes during local development and are absent from production routes, cards, sitemap, redirects, and sequence navigation.
- `scripts/validate-content.ts` is the public authoring contract. Extend it when the observable authoring contract changes; keep failures actionable.
- Frontmatter title is the only H1. Body headings are H2–H4 without skipped levels; generated outlines use H2/H3. Preserve portable GFM and reject raw HTML, unsupported embeds/directives, broken local targets, arbitrary MDX, and ambiguous code fences.
- Comments are optional enhancement after the body and before sequence navigation. Giscus uses this repository, strict pathname mapping, lazy loading, theme synchronization, and a static GitHub Discussions fallback. Article availability never depends on Giscus.
- Renamed paths produce static HTML/meta-refresh redirects with canonical metadata and stay out of the sitemap; do not claim they are HTTP 301 redirects or migrate old discussions.

## Implementation workflow

1. Read `CONTEXT.md`, the relevant ticket bodies, and affected source sections. Reuse the existing convention; do not create a second one.
2. Identify all exported-symbol call sites before changing the contract.
3. Use the pre-agreed test seams:
   - **Primary:** serve `dist` and exercise visitor-visible behavior in a real browser.
   - **Secondary:** run the public validation/build command against representative valid and invalid content or repository fixtures when failure output is the product behavior.
4. Run `pnpm check` regularly and the affected single test file after each vertical slice.
5. For UI work, exercise the actual built surface at desktop and narrow widths; inspect appearance, keyboard state, overflow, both themes, reduced motion, and the no-JavaScript baseline as applicable.
6. Run `/code-review` against the pinned pre-change fixed point and address every accepted finding.
7. Run `pnpm quality` once after the final implementation and review fixes. It must pass content validation, strict TypeScript, fixture/build tests, production Playwright tests, axe checks, and artifact SEO/resource checks.
8. Run `pnpm lighthouse` only for environment-sensitive release evidence. It performs three mobile runs per representative route and records medians; target misses require review, not a flaky deterministic CI failure.
9. Commit when requested. Push is a separate consequential action; a push to `main` automatically deploys.

Tests defend observable behavior, boundaries, invariants, transitions, and actionable failures. Avoid assertions on component boundaries, helper calls, utility classes, generated formatting, or other implementation details.

## Release and operations guardrails

- `.github/workflows/site.yml` is the only publishing workflow. Pull requests validate without deploying; successful `main` pushes deploy `dist` through GitHub Pages OIDC with least privilege.
- Keep the public repository as the single source, Pages, and Discussions repository. Do not introduce a deployment branch, release-tag gate, manual approval, repository deployment secret, separate comments repository, or custom rollback service.
- Cloudflare remains DNS-only. Domain verification values and DNS credentials stay outside the repository.
- Recovery is a normal revert on `main` followed by the normal validated deployment. A failed run must leave the last successful Site live.
- Before claiming launch completion, complete and record the real-browser/assistive-technology matrix, owner content approval, domain/HTTPS setup, Discussions/Giscus setup, and public HTTPS smoke checks described in the two docs above.

## Environment hygiene

Use the pinned Node and pnpm versions from `package.json` and commit the lockfile. CI and release checks use `pnpm install --frozen-lockfile`.

Keep `node_modules`, `dist*`, `.astro`, Playwright output, Lighthouse artifacts, and local environment files untracked. Agent-installed global pnpm versions and Playwright browser binaries are temporary workstation state; when installed solely for a task, remove them after verification if the user requests cleanup.

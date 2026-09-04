# edgseu.dev

Personal portfolio and technical writing site for **Aman Bhushan Singh**, a Cloud Security & Operations Engineer working across cloud infrastructure, DevSecOps, GitOps, Kubernetes, observability, and software supply-chain security.

**Live site:** [edgseu.dev](https://edgseu.dev/)

## What visitors will find

- A terminal-style introduction that works without JavaScript and answers real commands
- Selected public engineering projects, enriched at build time with live GitHub metadata
- Long-form technical articles with series navigation, per-article tables of contents, and discussion threads
- A professional profile, skills overview, and a hosted resume page at [/resume](https://edgseu.dev/resume/) with a print-ready layout and a PDF download action

## What this repository demonstrates

The repository doubles as an implementation sample. It shows:

- A statically generated, content-driven site built with Astro and TypeScript
- Portable Markdown articles guarded by a strict validator: frontmatter, headings, code fences, links, publication states, and cross-article rules
- A quality gate that runs locally in a pre-commit hook, so broken content cannot be committed
- A minimal GitHub Actions workflow that only builds and deploys, with no quality logic to drift out of sync
- Curated project data enriched at build time with public GitHub repository metadata and safe degradation on network failure
- Accessible interaction patterns, keyboard navigation, reduced-motion support, and responsive layouts down to 320 CSS pixels
- Canonical metadata, Open Graph and Twitter metadata, JSON-LD structured data, a generated sitemap, and a robots policy
- Self-hosted fonts and explicit page-weight, request-count, and asset-size budgets, verified against every built route

## Technical overview

| Area | Implementation |
| --- | --- |
| Framework | [Astro](https://astro.build/) 7, static output |
| Language | TypeScript 6 |
| Styling | Tailwind CSS 4 through Vite, plus the site stylesheet |
| Fonts | Self-hosted Adwaita Sans and JetBrains Mono (Fontsource) |
| Content | Markdown with GitHub Flavored Markdown |
| Validation | Zod and shared in-process content validators |
| Code quality | ESLint with `eslint-plugin-astro` and `typescript-eslint` |
| Browser testing | Playwright with Chromium and axe-core |
| Performance review | Lighthouse runner with repeat measurements |
| Hosting | GitHub Pages with a custom domain |
| Automation | Pre-commit quality hook, deploy-only GitHub Actions workflow, Dependabot |

## Content sources

The main content inputs are intentionally small and direct:

- `src/content/metadata.yaml`: profile details, links, skills, resume, and configuration
- `src/content/bio.md`: pure Markdown homepage biography
- `src/content/projects.yaml`: curated project catalog
- `src/content/articles/*/{metadata.yaml,index.md}`: draft and published articles with split metadata and body
- `src/content/resume.md`: the resume page body, rendered at `/resume/`
- `public/images/`: avatar and social assets

Everything else, including navigation, the profile rail, terminal commands, meta tags, sitemap, comments wiring, GitHub enrichment, and theme handling, adapts from those files.

## Make this your own (Portability)

This repository is designed so anyone can fork or clone it and make it their own by editing only content files:

1. **Site domain**: update `canonicalUrl` in `src/data/site.ts`.
2. **Profile and identity**: update `src/content/metadata.yaml` with your name, role, email, GitHub, LinkedIn, skills, and focus areas.
3. **Bio narrative**: update `src/content/bio.md`.
4. **Projects catalog**: update `src/content/projects.yaml` with your own repositories, summaries, and tags.
5. **Technical articles**: add articles under `src/content/articles/<slug>/` with `metadata.yaml` and `index.md`.
6. **Resume**: update `src/content/resume.md` and point `resumeUrl` at your own PDF.
7. **Avatar**: replace `public/images/avatar.png`.

## Run locally

Requirements: Node.js 24 and pnpm 11.24.0.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
git config core.hooksPath .githooks
pnpm dev
```

Astro serves the development site at `http://localhost:4321/` by default. Draft articles are visible in development and excluded from production builds.

Create and inspect the production output:

```bash
pnpm build
pnpm preview
```

## Quality commands

```bash
pnpm validate          # Validate profile, projects, articles, links, and content rules
pnpm lint              # ESLint over TypeScript and Astro components
pnpm check             # Content validation, linting, and Astro type checking
pnpm test              # Build, validation tests, and Playwright end-to-end tests
pnpm quality           # Complete release gate, including artifact checks
pnpm lighthouse        # Repeat performance measurements across representative routes
pnpm check:external    # Review owner-approved external destinations
```

`pnpm quality` runs as a pre-commit hook from `.githooks/pre-commit`. A commit cannot land until the full pipeline passes: content validation, lint, type checking, production build, unit tests, the Playwright suite, and the artifact check. Enable the hook after cloning with `git config core.hooksPath .githooks`.

## Deployment

The GitHub Actions workflow in `.github/workflows/site.yml` carries no quality logic. On a push to `main` it installs dependencies, builds the site, and deploys `dist/` through GitHub Pages to [edgseu.dev](https://edgseu.dev/). Because the pre-commit hook already gated every commit, deployment follows a push that is known good.

Article comments (giscus) activate when the `GISCUS_REPO_ID` and `GISCUS_CATEGORY_ID` repository variables are set and mapped by the workflow.

## Owner documentation

The detailed operating guide covers content updates, project and article publication, the resume page, comments, validation, hosting, deployment, dependency management, rollback, and troubleshooting:

**[Site user manual](docs/user-manual.md)**

# edgseu.dev

Personal portfolio and technical writing site for **Aman Bhushan Singh**, a Cloud Security & Operations Engineer focused on cloud infrastructure, DevSecOps, GitOps, Kubernetes, observability, and software supply-chain security.

**Live site:** [edgseu.dev](https://edgseu.dev/)

## What visitors will find

- Selected public engineering projects with direct links to their GitHub repositories
- Practical articles about secure delivery, infrastructure as code, GitOps, Kubernetes, and cloud operations
- A concise professional profile, skills overview, résumé link, and contact channels
- An interactive terminal-style introduction that remains usable without JavaScript

## What this repository demonstrates

The repository is also an implementation sample. It shows:

- A statically generated, content-driven site built with Astro and TypeScript
- Portable Markdown articles with validated frontmatter, links, headings, code fences, and publication states
- Curated project data enriched at build time with public GitHub repository metadata
- Accessible interaction patterns, keyboard navigation, reduced-motion support, and responsive layouts down to 320 CSS pixels
- Canonical metadata, Open Graph and Twitter metadata, structured data, a generated sitemap, and robots policy
- Explicit page-weight, request-count, and asset-size budgets, with responsive image variants generated at build time
- Automated content validation, linting, type checking, production builds, browser tests, accessibility checks, and artifact inspection
- GitHub Pages deployment only after the release gate passes

## Technical overview

| Area | Implementation |
| --- | --- |
| Framework | [Astro](https://astro.build/) 7, static output |
| Language | TypeScript 6 |
| Styling | Tailwind CSS 4 through Vite, plus the site stylesheet |
| Content | Markdown with GitHub Flavored Markdown |
| Validation | Zod and shared in-process content validators |
| Code quality | ESLint with `eslint-plugin-astro` and `typescript-eslint` |
| Browser testing | Playwright with Chromium and axe-core |
| Performance review | Lighthouse runner with repeat measurements |
| Hosting | GitHub Pages with a custom domain |
| Automation | GitHub Actions and Dependabot |

The main content sources are intentionally small and direct:

- `src/content/metadata.yaml` — profile details, links, skills, and configuration
- `src/content/bio.md` — pure Markdown homepage biography
- `src/content/projects.yaml` — curated project catalog
- `src/content/articles/*/{metadata.yaml,index.md}` — draft and published articles with split metadata and body
- `public/images/` — public profile and social assets

## Make this your own (Portability)

This repository is designed so anyone can fork/clone it and immediately make it their own by editing only content files:

1. **Site Domain**: Update `canonicalUrl` in `src/data/site.ts`.
2. **Profile & Identity**: Update `src/content/metadata.yaml` with your name, role, email, GitHub, LinkedIn, skills, and focus areas.
3. **Bio Narrative**: Update `src/content/bio.md` with your Markdown homepage introduction.
4. **Projects Catalog**: Update `src/content/projects.yaml` with your own repositories, summaries, and tags.
5. **Technical Articles**: Add your articles in `src/content/articles/<slug>/` with `metadata.yaml` and `index.md`.
6. **Avatar**: Replace `public/images/avatar.png`.

Everything else—including the header, navigation, profile sidebar, terminal introduction commands, meta tags, sitemap, GitHub Discussions comments, GitHub repository live metadata enrichment, and automated quality gates—adapts dynamically at runtime.

## Run locally

Requirements: Node.js 24 and pnpm 11.24.0.

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
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
pnpm quality           # Complete deterministic release gate, including artifact checks
pnpm lighthouse        # Three-run performance review across representative routes
pnpm check:external    # Review owner-approved external destinations
```

`pnpm quality` is the release gate. It runs locally as a pre-commit hook (`.githooks/pre-commit`), so commits are blocked until the full pipeline passes. Enable the hook after cloning with:

```bash
git config core.hooksPath .githooks
```

## Deployment

The pre-commit gate is the quality check; the GitHub Actions workflow in `.github/workflows/site.yml` only builds `dist/` and deploys it through GitHub Pages to [edgseu.dev](https://edgseu.dev/) on pushes to `main`. Article comments (giscus) activate when the `GISCUS_REPO_ID` and `GISCUS_CATEGORY_ID` repository variables are set.

## Owner documentation

The detailed operating guide covers content updates, project and article publication, comments, validation, hosting, deployment, dependency management, rollback, and troubleshooting:

**[Site user manual](docs/user-manual.md)**

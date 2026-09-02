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
- Explicit page-weight, request-count, and asset-size budgets
- Automated content validation, type checking, production builds, browser tests, accessibility checks, and artifact inspection
- GitHub Pages deployment only after the release gate passes

## Technical overview

| Area | Implementation |
| --- | --- |
| Framework | [Astro](https://astro.build/) 7, static output |
| Language | TypeScript 6 |
| Styling | Tailwind CSS 4 through Vite, plus the site stylesheet |
| Content | Markdown with GitHub Flavored Markdown |
| Validation | Zod and shared in-process content validators |
| Browser testing | Playwright with Chromium and axe-core |
| Performance review | Lighthouse runner with repeat measurements |
| Hosting | GitHub Pages with a custom domain |
| Automation | GitHub Actions and Dependabot |

The main content sources are intentionally small and direct:

- `src/content/profile.md` — profile details and homepage biography
- `src/content/projects.md` — curated project catalog
- `src/content/articles/*/index.md` — draft and published articles
- `public/images/` — public profile and social assets

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
pnpm check             # Content validation plus Astro type checking
pnpm test              # Build, validation tests, and Playwright end-to-end tests
pnpm quality           # Complete deterministic release gate, including artifact checks
pnpm lighthouse        # Three-run performance review across representative routes
pnpm check:external    # Review owner-approved external destinations
```

`pnpm quality` is the same release gate used before GitHub Pages deployment.

## Deployment

Pull requests run the release gate. A successful push to `main` uploads `dist/` and deploys it through GitHub Pages to [edgseu.dev](https://edgseu.dev/). The deployment workflow is defined in `.github/workflows/site.yml`.

## Owner documentation

The detailed operating guide covers content updates, project and article publication, comments, validation, hosting, deployment, dependency management, rollback, and troubleshooting:

**[Site user manual](docs/user-manual.md)**

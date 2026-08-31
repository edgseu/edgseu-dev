# Site operations

## Deployment model

`.github/workflows/site.yml` is the only publishing workflow. Pull requests run the frozen install and deterministic quality gate. A push to `main` runs the same gate, uploads `dist`, then deploys through GitHub Pages OIDC to the `github-pages` environment. No deployment branch or repository secret is used. A failed validation or deployment does not replace the last successful Pages artifact.

## One-time repository setup

1. Keep this repository public and enable **Settings → Pages → Source: GitHub Actions**.
2. Enable Discussions. Create an Announcements-format category named `Article comments`.
3. Install the Giscus app for this repository only. Generate configuration for `h1zardian/edgseu-dev`, strict `pathname` mapping, the `Article comments` category, reactions enabled, metadata disabled, and input above comments.
4. Add the generated repository and category IDs as repository variables `GISCUS_REPO_ID` and `GISCUS_CATEGORY_ID`. They are public identifiers, not secrets.
5. Keep GitHub security alerts enabled. Do not add an environment approval gate.

## Canonical domain

Verify `edgseu.dev` at the GitHub account level using the exact TXT value GitHub generates for `h1zardian`; do not store that value in this repository. In Cloudflare, keep every record DNS-only:

- apex `A`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`;
- apex `AAAA`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`;
- `www` `CNAME`: `h1zardian.github.io`.

After DNS resolves, set the Pages custom domain to `edgseu.dev` and enable **Enforce HTTPS** after GitHub issues the certificate. `public/CNAME` keeps the canonical domain in each artifact. Keep domain auto-renew enabled. Cloudflare proxying and repository-held DNS credentials are outside this operating model.

## Release and recovery

A normal merge to `main` is a release. Verify the HTTPS Homepage, Projects index, Articles index, representative Article, comments fallback, sitemap, robots policy, share metadata, and `www` alias after the deployment succeeds.

To recover from a bad successful release, revert the offending commit on `main` and let the normal workflow validate and deploy the revert. Do not redeploy an old artifact manually. If the revert fails validation, fix the failure on the revert branch; the last successful Site remains live.

Monthly grouped Dependabot pull requests cover pnpm and GitHub Actions. Merge only after project checks pass. Review scheduled external-link failures as third-party signals rather than bypassing deterministic checks.

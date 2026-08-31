# First Release verification evidence

This record separates deterministic release checks from environment-sensitive launch review. A row is complete only when it names the environment, browser or assistive-technology version, route, theme and viewport, result, and linked exception when applicable.

## Deterministic evidence

| Check | Environment | Scope | Result |
| --- | --- | --- | --- |
| Strict TypeScript and content validation | Linux x64, Node 26.7.0 running the Node 24-pinned project | Project and Article contracts | Pass |
| Chromium production-artifact smoke | Playwright 1.62.1, Chrome for Testing 151.0.7922.34 | Homepage, Projects, Articles, representative Article, redirect; desktop and 375 px mobile | Pass |
| Automated accessibility | axe-core 4.13.0, Chrome for Testing 151.0.7922.34 | Every route template in dark and light themes | Pass, zero violations |
| Reflow and reduced motion | Chrome for Testing 151.0.7922.34 | 320 CSS px, both responsive templates; representative Article with reduced motion | Pass |
| SEO, internal links, and resource budgets | Production `dist` artifact | Every generated HTML route, sitemap, robots policy | Pass |
| Draft and zero-Published-Article behavior | Astro production and development artifacts | Draft preview, Draft exclusion, empty Homepage/index, sitemap exclusion | Pass |

## Lighthouse medians

Run `pnpm build && pnpm lighthouse`. The pinned runner performs three mobile runs per route and writes `artifacts/lighthouse-summary.json`. The 2026-08-31 Linux x64 review used Chrome for Testing 151.0.7922.34. Review targets are Performance ≥ 90, LCP ≤ 2.5 s, CLS ≤ 0.10, and TBT ≤ 200 ms. A miss requires a time-bounded quality-exception issue; it does not become a flaky CI failure.

| Route | Browser | Runs | Performance | LCP | CLS | TBT | Result |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | Chrome for Testing 151.0.7922.34 | 3 | 100 | 903 ms | 0 | 0 ms | Pass |
| `/projects/` | Chrome for Testing 151.0.7922.34 | 3 | 100 | 902 ms | 0 | 0 ms | Pass |
| `/articles/` | Chrome for Testing 151.0.7922.34 | 3 | 100 | 902 ms | 0 | 0 ms | Pass |
| Representative Article | Chrome for Testing 151.0.7922.34 | 3 | 100 | 902 ms | 0 | 0 ms | Pass |

## Required launch matrix

The following checks require the named real platforms. They must be completed before launch and after relevant browser, interaction, layout, type, or motion changes. Structural behavior—not pixel identity—is the criterion. Older fallbacks must retain readable static content and ordinary links.

| Platform | Required versions and viewport | Themes | Required paths | Status |
| --- | --- | --- | --- | --- |
| Chrome desktop | Current and previous major, desktop and narrow Android emulation | Dark, light | Static content, navigation, terminal keyboard, responsive layout, outline, code copy, comments fallback | Pending real-browser launch review |
| Edge desktop | Current and previous major, desktop and narrow | Dark, light | Same structural smoke | Pending real-browser launch review |
| Firefox desktop | Current and previous major, desktop and narrow | Dark, light | Same structural smoke | Pending real-browser launch review |
| Safari desktop | Current and previous major, desktop and narrow | Dark, light | Same structural smoke | Pending macOS launch review |
| iOS Safari | Current and previous major, representative iPhone narrow viewport | Dark, light | Navigation, Article reading, outline, code copy, comments fallback | Pending iOS launch review |
| Android Chrome | Current and previous major, 320–390 CSS px | Dark, light | Navigation, terminal keyboard, Article layout and overflow | Pending Android launch review |

## Required assistive-technology review

| Pairing | Paths | Required observations | Status |
| --- | --- | --- | --- |
| NVDA with Firefox desktop | Shared navigation, terminal commands, representative Article, code-copy status | Names, landmarks, focus order/return, reading order, live status | Pending Windows launch review |
| VoiceOver with Safari or iOS | Shared navigation, disclosures, representative Article, code-copy status | Rotor structure, names, focus return, reading order, status feedback | Pending Apple-platform launch review |

No exception may waive missing approved content, a keyboard trap, or inaccessible navigation. Any other launch exception must use `.github/ISSUE_TEMPLATE/quality-exception.yml` and include an owner, exact evidence, mitigation, and expiration date.

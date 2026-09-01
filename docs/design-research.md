# Visual Design Research & System Audit: edgseu.dev

**Target Platform**: `edgseu.dev` (Astro 7 + Tailwind CSS v4 static architecture)  
**Primary Product Goal**: Recruiter-first Cloud Security & Operations Engineering portfolio and technical knowledge base  
**Evaluation Standard**: Grounded in W3C/WAI official standards, first-party platform specifications, and primary design system frameworks (GitHub Primer, Apple HIG, Google Material Design 3, IBM Carbon, USWDS).

---

## 1. Executive Summary & Frank Evaluation

### 1.1 Product Mission & The Recruiter-First Persona
`edgseu.dev` represents the professional identity of Aman Bhushan Singh (`edgseu`), a Cloud Security & Operations Engineer specializing in AWS, Azure, Kubernetes, GitOps, and security automation.

The first viewport must make the Person's role, domain focus, proof of work, and direct destinations easy to scan. That requirement comes from this repository's recruiter-first product goal; it is not presented as a timed-recruiter-study claim. The visual design should therefore deliver:
1. **Immediate Proof of Competence**: Unambiguous visual hierarchy communicating technical role, domain focus (Cloud, DevSecOps, Supply Chain Security), and key platforms (AWS, Azure, K8s).
2. **Frictionless Navigation to Artifacts**: Prominent, highly accessible direct links to GitHub repositories, LinkedIn, email, and résumé.
3. **High Information Density with Visual Restraint**: Clean typographic rhythm, comfortable line measures, and clear card metadata, avoiding decorative novelty that obscures real engineering substance.
4. **Preserved Accessibility & Performance**: Maintain the Site's tested keyboard, reflow, reduced-motion, accessibility, and static-delivery behavior.

### 1.2 Current Visual System Score: 6.2 / 10
*Rating Rationale*: The Site has a strong technical foundation: the recorded deterministic checks pass at 320px reflow with zero axe-core violations, and the recorded Lighthouse performance medians are 100 with LCP below 950ms, CLS 0, and TBT 0ms ([repository release evidence](./release-evidence.md)). Its visual styling is less resolved: the terminal motif, repeated pills, flat gray surfaces, and several simultaneous accents compete with the proof of work.

| Dimension | Score | Status Summary |
|---|:---:|---|
| **Accessibility Compliance (WCAG 2.2)** | **8.5 / 10** | Strong tested foundation; the light warning token still fails contrast in its current small-text uses. |
| **Color Palette & Visual Restraint** | **5.0 / 10** | Saturated "rainbow" section tints and uncalibrated 0% chroma dark canvas. |
| **Typography & Hierarchy** | **6.5 / 10** | Solid responsive scale; needs more deliberate hierarchy, tracking, and measure. |
| **Surfaces, Elevation & Borders** | **5.5 / 10** | Flat opaque gray wireframe borders; article body boxed into a claustrophobic card. |
| **Layout & Recruiter Scanability** | **6.5 / 10** | Solid profile sidebar; interactive terminal widget consumes prime above-the-fold space. |
| **Micro-Interactions & Affordances** | **7.0 / 10** | Accessible focus rings and copy feedback; hover states lack tactile depth. |

### 1.3 Methodology & Citation Legend
Recommendations in this document are strictly categorized to distinguish normative accessibility mandates from opinionated visual craft:
- `[OBJECTIVE / MUST-FIX]`: Explicit violations of official W3C standards (e.g., WCAG 2.2 Success Criteria) or browser rendering specifications.
- `[SUBJECTIVE / AESTHETIC]`: Opinionated visual craft recommendations derived from established first-party design systems (e.g., Apple HIG, Google M3, IBM Carbon, GitHub Primer, USWDS).

---

## 2. Primary Source Framework & Specifications

This audit is grounded exclusively in the following primary standards and first-party design system specifications:

1. **W3C Web Content Accessibility Guidelines (WCAG) 2.2**
   - [WCAG 2.2 SC 1.4.3 Contrast (Minimum) (Level AA)](https://www.w3.org/TR/WCAG22/#contrast-minimum)
   - [WCAG 2.2 SC 1.4.6 Contrast (Enhanced) (Level AAA)](https://www.w3.org/TR/WCAG22/#contrast-enhanced)
   - [WCAG 2.2 SC 1.4.11 Non-text Contrast (Level AA)](https://www.w3.org/TR/WCAG22/#non-text-contrast)
   - [WCAG 2.2 SC 1.4.10 Reflow (Level AA)](https://www.w3.org/TR/WCAG22/#reflow)
   - [WCAG 2.2 SC 1.4.12 Text Spacing (Level AA)](https://www.w3.org/TR/WCAG22/#text-spacing)
   - [WCAG 2.2 SC 2.4.7 Focus Visible (Level AA)](https://www.w3.org/TR/WCAG22/#focus-visible)
   - [WCAG 2.2 SC 2.4.13 Focus Appearance (Level AAA)](https://www.w3.org/TR/WCAG22/#focus-appearance)
   - [WCAG 2.2 SC 2.5.8 Target Size (Minimum) (Level AA)](https://www.w3.org/TR/WCAG22/#target-size-minimum)
   - [WCAG 2.2 SC 2.5.5 Target Size (Enhanced) (Level AAA)](https://www.w3.org/TR/WCAG22/#target-size-enhanced)
2. **W3C WAI-ARIA Authoring Practices Guide (APG)**
   - [WAI-ARIA APG: Landmark Regions](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/)
   - [WAI-ARIA APG: Disclosure (Show/Hide) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
3. **W3C CSS Specifications**
   - [W3C CSS Color Module Level 4 (OKLCH, Perceptual Uniformity)](https://www.w3.org/TR/css-color-4/)
   - [W3C Media Queries Level 5 (`prefers-reduced-motion`)](https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion)
4. **First-Party Design System Frameworks**
   - [GitHub Primer Design System: Color Foundations](https://primer.style/foundations/color) & [Primer Typography](https://primer.style/foundations/typography)
   - [Apple Human Interface Guidelines (HIG): Color](https://developer.apple.com/design/human-interface-guidelines/color) & [HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
   - [Google Material Design 3 (M3): Color System](https://m3.material.io/styles/color/system/overview) & [M3 Elevation](https://m3.material.io/styles/elevation/overview)
   - [IBM Carbon Design System: 2x Grid & Spacing](https://carbondesignsystem.com/guidelines/spacing/overview/) & [Carbon Typography](https://carbondesignsystem.com/guidelines/typography/overview/)
   - [U.S. Web Design System (USWDS): Color Tokens](https://designsystem.digital.gov/design-tokens/color/overview/) & [Typesetting](https://designsystem.digital.gov/design-tokens/typesetting/overview/)

---

## 3. Detailed Audit by Dimension

### 3.1 Color Palette, Accents & Contrast

#### Current State Observations
- **Dark Neutral Scale**: Canvas `#1F1F1F`, Surface `#272727`, Subtle `#323232`, Border `#3D3D3D`.
- **Light Neutral Scale**: Canvas `#F8FAFC`, Surface `#FFFFFF`, Subtle `#F1F5F9`, Border `#E2E8F0`.
- **Accent Proliferation**: 
  - Overview / Brand: Sky Blue (`#38BDF8` dark / `#0369A1` light)
  - Projects Section: Mint/Teal (`#4FD1A5` dark / `#087B5A` light)
  - Articles Section: Violet (`#B490F5` dark / `#7740A8` light)
  - Pinned Pills: Amber (`#F3B85A` dark / `#9A5D00` light)
  - Terminal Elements: Green, Pink, Yellow, Orange, Cyan multi-color span classes.

#### Contrast Ratios & Objective Violations
A systematic calculation of relative luminance and contrast ratios under the W3C WCAG 2.2 formula demonstrates:

```
+------------------------------------------------------------------------------------------------+
| WCAG 2.2 Contrast Evaluation Table                                                             |
+----------------------+--------------------+--------------------+---------------+---------------+
| Token / Element      | Foreground Color   | Background Color   | Ratio         | WCAG Status   |
+----------------------+--------------------+--------------------+---------------+---------------+
| Dark Body Text       | #F3F4F6 (Text)     | #1F1F1F (Canvas)   | 14.98 : 1     | PASS (AAA)    |
| Dark Muted Text      | #9CA3AF (Muted)    | #272727 (Surface)  | 5.88 : 1      | PASS (AA)     |
| Dark Brand Accent    | #38BDF8 (Accent)   | #1F1F1F (Canvas)   | 7.69 : 1      | PASS (AAA)    |
| Dark Project Accent  | #4FD1A5 (Project)  | #272727 (Surface)  | 7.82 : 1      | PASS (AAA)    |
| Dark Article Accent  | #B490F5 (Article)  | #272727 (Surface)  | 5.87 : 1      | PASS (AA)     |
+----------------------+--------------------+--------------------+---------------+---------------+
| Light Body Text      | #0F172A (Text)     | #FFFFFF (Surface)  | 17.85 : 1     | PASS (AAA)    |
| Light Muted Text     | #475569 (Muted)    | #FFFFFF (Surface)  | 7.58 : 1      | PASS (AAA)    |
| Light Brand Accent   | #0369A1 (Accent)   | #FFFFFF (Surface)  | 5.93 : 1      | PASS (AA)     |
| Light Warning (Draft)| #D97706 (Warning)  | #F8FAFC (Canvas)   | 3.04 : 1      | FAIL (AA)     |
| Light Terminal Path  | #D97706 (Warning)  | #FFFFFF (Surface)  | 3.19 : 1      | FAIL (AA)     |
| Light Terminal Hint  | #D97706 (Warning)  | #F1F5F9 (Subtle)   | 2.91 : 1      | FAIL (AA Non) |
+----------------------+--------------------+--------------------+---------------+---------------+
```

1. `[OBJECTIVE / MUST-FIX]` **Light Theme Warning Token Contrast Failure**:
   - *Issue*: In `src/styles/global.css` (line 703), `.draft-banner` uses `color: var(--warning)` (`#D97706`) against background `#F8FAFC`, producing a contrast ratio of **3.04:1**.
   - *Standard*: [W3C WCAG 2.2 SC 1.4.3 Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#contrast-minimum) requires at least **4.5:1** for regular text (< 18pt or < 14pt bold).
   - *Fix*: In light mode, darken `--warning` to at least `#B45309` (4.80:1 on canvas; 4.58:1 on subtle) or `#92400E` (6.78:1 on canvas), or use a dedicated `--warning-text` token.
2. `[OBJECTIVE / MUST-FIX]` **Light Theme Terminal Warning Contrast Failure**:
   - *Issue*: `.terminal-hint-icon` uses `#D97706` on `#F1F5F9`, yielding **2.91:1**; `.prompt-path` uses the same token on `#FFFFFF`, yielding **3.19:1**.
   - *Standard*: [W3C WCAG 2.2 SC 1.4.11 Non-text Contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast) requires at least **3.0:1** for meaningful interface graphics, while [SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) requires **4.5:1** for regular text.
   - *Fix*: Use the darker warning token for warning text. If the hint icon is decorative, remove it from the meaningful color contract; if meaningful, keep it above 3.0:1.

#### Aesthetic & Design System Evaluation
3. `[SUBJECTIVE / AESTHETIC]` **The "Rainbow Section" Anti-Pattern**:
   - *Analysis*: The current palette assigns a hue to each content type: sky blue for Overview, mint/teal for Projects, violet for Articles, amber for pinned items, plus several terminal colors. [GitHub Primer color foundations](https://primer.style/foundations/color) and [Apple HIG color guidance](https://developer.apple.com/design/human-interface-guidelines/color) describe role-based, consistent color use; the judgment that this Site's simultaneous hues feel fragmented is subjective.
   - *Recommendation*: Use the role-based color approach described by [Google Material Design 3](https://m3.material.io/styles/color/system/overview), applied here as:
     - **Dominant neutral base**: Deep slate / obsidian canvas.
     - **Secondary neutral surfaces**: Layered cards, subtle chips, and monochromatic text hierarchy.
     - **One unified interactive accent**: Muted cyan (`#5CC8D7` dark / `#086F83` light) reserved for links, active tabs, focus indicators, and primary actions.
     - **Semantic accents only where meaning exists**: Emerald for availability and amber for pinned/highlighted proof of work.
4. `[SUBJECTIVE / AESTHETIC]` **Muddy Neutral Dark Background (0% Chroma)**:
   - *Analysis*: `#1F1F1F` ($R=31, G=31, B=31$) is a neutral gray. [W3C CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/) defines perceptual color spaces such as OKLCH; the judgment that a slightly blue slate feels richer and more cohesive is subjective, not a requirement of the specification.
   - *Recommendation*: Shift the dark scale into a low-chroma slate palette, producing a deep midnight canvas such as `#0B1016` with subtly blue surfaces.

---

### 3.2 Layout & Information Architecture (Recruiter-First Focus)

#### Current State Observations
- **Homepage Structure**: Two-column layout with a fixed-width sticky sidebar (`ProfileRail.astro`, `minmax(15rem, 18rem)`) on the left and a content column (`.home-main`) on the right.
- **Above-the-Fold Real Estate**: The content column places the interactive terminal (`Terminal.astro`) at the top, consuming ~18–22rem of vertical height, followed by the profile biography prose, followed by Selected Projects.
- **Article Reading Layout**: Sticky table-of-contents rail on the left (14.5rem) and prose content on the right (max 46rem width).

```
Current Homepage Desktop Layout:
+-----------------------------------------------------------------------------------+
| Site Header (Sticky: Wordmark | Desktop Nav: Overview, Projects, Articles | Theme)|
+-------------------+---------------------------------------------------------------+
| Profile Sidebar   | Terminal Component (~20rem tall, interactive shell)           |
| (Sticky Rail:     |                                                               |
|  - Avatar         +---------------------------------------------------------------+
|  - Name, Role     | Profile Bio Prose ("Cloud systems with security...")          |
|  - Location       +---------------------------------------------------------------+
|  - Focus tags     | Selected Projects (2x2 Grid or 2 Cards)                       |
|  - Links: Email,  | - DevSecOps Pipeline Project (Tags, Metadata, GitHub link)    |
|    GitHub,        | - Cowrie Sentinel Lab (Tags, Metadata, GitHub link)           |
|    LinkedIn,      +---------------------------------------------------------------+
|    Résumé)        | Latest Articles (2 Cards)                                     |
|                   | - Portable technical writing cards                            |
+-------------------+---------------------------------------------------------------+
| Site Footer (Copyright, Static Accessibility Note, Social Navigation Links)       |
+-----------------------------------------------------------------------------------+
```

#### Recruiter Experience Evaluation
1. `[SUBJECTIVE / AESTHETIC]` **Information Duplication Above the Fold**:
   - *Analysis*: The terminal widget automatically renders a simulated `whoami` output with the candidate's name, role, location, skills, Project count, and Article count. This restates information already visible in the adjacent profile rail.
   - *Recruiter Impact*: On the observed 1440px desktop viewport, duplicate identity facts occupy the first screen while Selected Projects begin below it.
   - *Recommendation*: 
     - **Option A (Refined Precision CLI)**: Reduce the terminal's default height to a compact 3-4 line precision status strip (e.g., live uptime, cluster connection indicator, primary toolchain summary) with quick-command chips (`projects`, `skills`, `contact`, `clear`).
     - **Option B (Hero Project Elevation)**: Place the flagship Project immediately below the profile introduction so proof of work appears in or near the first viewport.
2. `[OBJECTIVE / SAFEGUARD]` **Responsive Reflow & Landmark Structure**:
   - *Standard*: [W3C WCAG 2.2 SC 1.4.10 Reflow](https://www.w3.org/TR/WCAG22/#reflow) and [WAI-ARIA APG Landmarks](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/).
   - *Status*: The site handles 320px viewport reflow cleanly without horizontal scrollbars. Sidebar collapses into a natural single column below `64rem` (1024px). Semantic `<aside>`, `<main>`, `<header>`, and `<footer>` elements provide standard navigation landmarks. This must remain strictly protected.

---

### 3.3 Typography & Readability

#### Current State Observations
- **Font Stack**: 
  - UI Sans: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Code/Mono: `ui-monospace, SFMono-Regular, "Cascadia Code", "Liberation Mono", Menlo, Consolas, monospace`
- **Type Scale**:
  - H1 Display (Page Header): `clamp(2.1rem, 4.5vw, 2.85rem)`, line-height `1.08`, tracking `-0.035em`, weight `720`
  - H1 Article Title: `clamp(2.35rem, 6vw, 3.65rem)`, line-height `1.04`, tracking `-0.045em`
  - H2 Section Title: `1.5rem` (24px), line-height `1.15`, tracking `-0.025em`, weight `720`
  - H3 Card Title: `1.15rem` (18.4px), line-height `1.3`, weight `700`
  - Body Text: `1rem` (16px), line-height `1.6` (`1.75` in prose)
  - Eyebrow / Micro-labels: `0.78rem` (12.48px), tracking `0.08em`, weight `700`, uppercase mono
- **Prose Line Measure**: Max width `46rem` (~736px, approximately 70–80 characters per line).

#### Evaluation Against Primary Standards
1. `[OBJECTIVE / SAFEGUARD]` **Text Spacing & Scalability**:
   - *Standard*: [W3C WCAG 2.2 SC 1.4.12 Text Spacing](https://www.w3.org/TR/WCAG22/#text-spacing) requires content and functionality to survive specified user overrides for line height, paragraph spacing, letter spacing, and word spacing.
   - *Status*: The body and prose line-height values already exceed 1.5, but CSS values alone do not verify the full criterion. Preserve the layout under all four specified overrides.
2. `[SUBJECTIVE / AESTHETIC]` **Typographic Scale & Rhythm**:
   - *Guidance*: [USWDS Typesetting Overview](https://designsystem.digital.gov/design-tokens/typesetting/overview/) and [IBM Carbon Typography Guidelines](https://carbondesignsystem.com/guidelines/typography/overview/).
   - *Analysis*: The existing clamp scales work well across screen sizes. However, optical tracking on smaller body and secondary text lacks precision:
     - Headings benefit from tight negative tracking (`-0.025em` to `-0.035em`) to maintain optical density.
     - Micro-labels, badges, and monospace metadata require slight positive tracking (`+0.015em` to `+0.04em`) to prevent glyph collision on low-DPI displays.
3. `[SUBJECTIVE / AESTHETIC]` **Keep the Fast System Stack; Refine Its Hierarchy**:
   - *Recommendation*: Retain the current system sans and monospace stacks instead of adding a font download. Improve perceived craft through the existing variable size, weight, tracking, and line-height controls; use tabular numerals only on dates, durations, and terminal counters where alignment is useful.

---

### 3.4 Surfaces, Elevation & Borders

#### Current State Observations
- **Surface Contrast**: Dark Canvas `#1F1F1F` vs. Surface `#272727` ($\Delta L \approx 0.035$).
- **Border Treatment**: Heavy flat opaque gray lines (`1px solid #3D3D3D` in dark mode, `1px solid #E2E8F0` in light mode).
- **Article Detail Page Container**: In `src/styles/global.css` (line 719), `.prose` wraps the entire article markdown inside a bordered, rounded dark card with `padding: 2.25rem; border: 1px solid var(--border); border-radius: 0.65rem; background: var(--surface);`.

#### Evaluation & Recommendations
1. `[SUBJECTIVE / AESTHETIC]` **Unbox Long-Form Article Prose**:
   - *Analysis*: The current outer border, surface fill, and padding make the entire Article read as one large dashboard card. [Apple HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout) and [GitHub Primer Layout](https://primer.style/foundations/layout) provide spacing and content-width principles; the decision to let this Site's prose flow on the canvas is the audit's subjective application of those principles.
   - *Recommendation*:
     - Remove the outer card border and surface fill from `.prose` at wide viewports.
     - Keep a readable line measure and deliberate inline gutters.
     - Reserve elevated `--surface` cards and subtle borders for discrete code blocks, callouts, tables, and disclosures.
2. `[SUBJECTIVE / AESTHETIC]` **Translucent Alpha Borders vs. Opaque Gray Lines**:
   - *Analysis*: Dark theme opaque borders (`#3D3D3D`) create harsh, distracting wireframe grids.
   - *Guidance*: [Google Material Design 3 elevation](https://m3.material.io/styles/elevation/overview) distinguishes surface roles and elevation. The following alpha-border and highlight treatment is this audit's restrained application of that guidance, not a prescribed Material component.
   - *Recommendation*: Replace opaque dark gray borders with low-contrast translucent borders (`rgba(255, 255, 255, 0.08)` / `--border`) and a subtle top highlight:
   ```css
   /* Tactile dark surface physics */
   .project-card, .article-card, .profile-card {
     background: var(--surface);
     border: 1px solid rgba(255, 255, 255, 0.08);
     box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.06),
                 0 2px 8px rgba(0, 0, 0, 0.35);
   }
   ```

---

### 3.5 Spacing, Grid & Visual Rhythm

#### Current State Observations
- **Base Grid**: 4px / 8px incremental scale (0.25rem = 4px, 0.5rem = 8px, 0.75rem = 12px, 1rem = 16px, 1.5rem = 24px, 2rem = 32px, 3rem = 48px).
- **Max Container Width**: `min(75rem, calc(100% - 2rem))` (1200px max width with 1rem inline margins on viewports < 1200px).
- **Card Grids**:
  - Homepage Projects: 2x2 grid on desktop (`.cards-grid-2x2`), collapses to 1 column at `640px`.
  - Projects Index: 2-column grid (`.project-index-grid`), collapses to 1 column at `768px`.
  - Articles Index: Single-column list with max width `62rem` (`.article-index-list`).

#### Evaluation Against Primary Standards
1. `[SUBJECTIVE / AESTHETIC]` **Grid Spacing Consistency**:
   - *Guidance*: [IBM Carbon 2x Grid](https://carbondesignsystem.com/guidelines/spacing/overview/) and [USWDS Spacing Units](https://designsystem.digital.gov/design-tokens/spacing-units/) demonstrate tokenized spacing scales; neither makes this Site's exact 8px rhythm a conformance requirement.
   - *Recommendation*: Standardize irregular gaps such as `0.85rem` and `1.15rem` to the existing scale: `0.75rem` (12px), `1rem` (16px), or `1.5rem` (24px).
2. `[OBJECTIVE / SAFEGUARD]` **Touch Target Sizing**:
   - *Standard*: [W3C WCAG 2.2 SC 2.5.8 Target Size (Minimum)](https://www.w3.org/TR/WCAG22/#target-size-minimum) requires at least **24x24 CSS pixels** or sufficient spacing/exceptions. [WCAG 2.2 SC 2.5.5 (Level AAA)](https://www.w3.org/TR/WCAG22/#target-size-enhanced) sets a 44x44 CSS-pixel enhanced target; [Apple HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) separately recommends 44x44 points for touch controls on Apple platforms.
   - *Status*: The observed navigation and controls meet the WCAG minimum. Preserve at least 44px mobile toggle and terminal-command targets as a Site usability goal rather than reporting a current violation.

---

### 3.6 Micro-Interactions, Motion & Affordances

#### Current State Observations
- **Focus Rings**: `outline: 0.2rem solid var(--focus); outline-offset: 0.2rem;` applied to all `:focus-visible` interactive elements.
- **Card Hover**: `transition: border-color 0.15s ease, box-shadow 0.15s ease;` with section-accent border color swaps.
- **Reduced Motion Support**: Strict global override in `global.css` (lines 786–788) neutralizing all durations and animations when `prefers-reduced-motion: reduce` is active.

#### Evaluation Against Primary Standards
1. `[OBJECTIVE / SAFEGUARD]` **Focus Indicator Conformance**:
   - *Standard*: [W3C WCAG 2.2 SC 2.4.7 Focus Visible](https://www.w3.org/TR/WCAG22/#focus-visible) requires a visible keyboard focus indicator; [WCAG 2.2 SC 2.4.13 Focus Appearance](https://www.w3.org/TR/WCAG22/#focus-appearance) defines the stronger AAA geometry and contrast target.
   - *Status*: The current 0.2rem solid outline with 0.2rem offset is prominent in both themes and the recorded automated keyboard/accessibility checks pass. Preserve it; do not infer full AAA conformance from color contrast alone.
2. `[SUBJECTIVE / AESTHETIC]` **Restrained Hover Depth**:
   - *Analysis*: The existing 0.15s transition is smooth but changes only the section-colored border, reinforcing the wireframe look.
   - *Recommendation*: Add a subtle surface/shadow response; limit translation to 1px or omit it if the result feels animated rather than precise:
   ```css
   .project-card, .article-card {
     transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                 border-color 0.2s ease,
                 box-shadow 0.2s ease;
   }
   .project-card:hover, .article-card:hover {
     transform: translateY(-1px);
     border-color: var(--border-strong);
     box-shadow: 0 6px 18px rgba(0, 0, 0, 0.24),
                 inset 0 1px 0 rgba(255, 255, 255, 0.08);
   }
   ```

---

## 4. What Should Remain Unchanged

To protect the repository's core constraints, static speed, and engineering discipline, the following elements **MUST NOT** be altered:

1. **Static, Framework-Free Baseline**:
   - The Site uses Astro static output and focused vanilla TypeScript rather than a client-rendered framework or site-wide hydration layer. Preserve that architecture and its ordinary-link/content baseline.
2. **Recorded Deterministic Quality & Performance**:
   - The current repository evidence records Lighthouse **Performance** medians of 100 on four representative routes, LCP below 950ms, CLS 0, and TBT 0ms, plus separate passing axe, reflow, and artifact checks ([release evidence](./release-evidence.md)). Preserve those results without claiming unrecorded Lighthouse category scores.
3. **Core Recruiter Data Contracts**:
   - The Markdown and TypeScript data schemas (`src/content/profile.md`, `src/data/projects.ts`, `src/lib/articles.ts`) provide clean, decoupled candidate facts.
4. **Direct Proof-of-Work Links**:
   - Project cards link directly to real public GitHub repositories (`https://github.com/h1zardian/...`) without intermediate redirect walls or fluff.
5. **Robust Accessibility Foundations**:
   - The skip link (`.skip-link`), WAI-ARIA live regions (`role="log"`, `aria-live="polite"`), `noscript` fallbacks, table wrapper scrolling regions, and `prefers-reduced-motion` overrides are exemplary and must be retained.

---

## 5. Prioritized Implementation Roadmap

```
+-----------------------------------------------------------------------------------+
| Implementation Priority Matrix                                                    |
+----------+-----------------------------------+-------------+----------------------+
| Priority | Action Item                       | Type        | Standard / Guidance  |
+----------+-----------------------------------+-------------+----------------------+
| P0       | Fix light warning text and icon   | Objective   | WCAG 2.2 SC 1.4.3 &  |
|          | contrast for their actual uses    | Must-Fix    | SC 1.4.11            |
+----------+-----------------------------------+-------------+----------------------+
| P1       | Unbox Article prose from .prose   | Subjective  | Apple HIG Layout &   |
|          | card onto open canvas             | Aesthetic   | GitHub Primer        |
+----------+-----------------------------------+-------------+----------------------+
| P1       | Replace competing section hues   | Subjective  | Google M3 Color &    |
|          | with one interactive accent       | Aesthetic   | Apple HIG Color      |
+----------+-----------------------------------+-------------+----------------------+
| P1       | Calibrate dark neutrals to deep   | Subjective  | W3C CSS Color 4 &    |
|          | slate with translucent borders    | Aesthetic   | Google M3 Elevation  |
+----------+-----------------------------------+-------------+----------------------+
| P2       | Streamline terminal to compact    | Subjective  | Repository's         |
|          | precision CLI; elevate projects   | UX Polish   | recruiter-first goal |
+----------+-----------------------------------+-------------+----------------------+
| P2       | Refine typography tracking &      | Subjective  | IBM Carbon & USWDS   |
|          | tactile hover micro-elevation     | Aesthetic   | Typesetting Tokens   |
+----------+-----------------------------------+-------------+----------------------+
```

### Phase 1: Must-Fix Accessibility & Contrast (P0)
- Adjust light theme `--warning` from `#D97706` to `#B45309` (4.80:1 against canvas; 4.58:1 against subtle) or `#92400E` (6.78:1 against canvas).
- Ensure all draft banners, warning badges, and terminal status icons meet or exceed the 4.5:1 text and 3.0:1 non-text contrast ratios in both themes.

### Phase 2: Color Token & Surface Overhaul (P1)
- Implement a calibrated deep-slate neutral scale in `src/styles/global.css`.
- Remove section-specific accent overrides (`--project-accent`, `--article-accent`) across cards and navigation.
- Unify interactive elements under the muted cyan brand accent (`#5CC8D7` dark / `#086F83` light).
- Replace opaque gray wireframe borders with translucent alpha borders (`rgba(255, 255, 255, 0.08)` in dark mode).

### Phase 3: Layout & Information Hierarchy Refinement (P1)
- Remove outer card wrapper on `.prose` in `src/pages/articles/[slug].astro` and `src/styles/global.css`.
- Elevate code blocks (`.code-block`) and tables with clean border highlights.
- Streamline the homepage terminal output to remove duplicate bio text and ensure Selected Projects are immediately visible above or near the fold.

### Phase 4: Typographic & Micro-Interaction Polish (P2)
- Apply negative tracking (`-0.025em` to `-0.035em`) to H1/H2 headings.
- Apply positive tracking (`+0.02em`) to monospace badges and metadata.
- Use subtle `translateY(-1px)` hover feedback only if visual review shows that shadow and color alone are insufficient.

---

## 6. Concrete Implementable Token & Style Specification

The following conservative palette can map onto the existing token layer without adding a new color convention. Text and accent values were checked against their respective canvas colors using the WCAG relative-luminance formula; actual component combinations must still be tested after implementation.

```css
:root,
:root[data-theme="dark"] {
  color-scheme: dark;

  /* Quiet blue-slate depth instead of neutral charcoal. */
  --canvas: #0B1016;
  --surface: #111821;
  --subtle: #17202B;
  --border: #253241;
  --border-subtle: #1C2632;

  --text: #E8EEF5;          /* 16.35:1 on canvas */
  --muted: #94A3B8;         /* 7.45:1 on canvas */
  --accent: #5CC8D7;        /* 9.73:1 on canvas */
  --accent-strong: #8ADDE7;
  --focus: #5CC8D7;

  /* Keep secondary/semantic hues sparse and meaningful. */
  --secondary: #A78BFA;
  --success: #66C2A5;
  --warning: #D6A85F;
  --danger: #F08080;
  --attention-accent: #D6A85F;

  /* Existing section-token consumers can converge without a second hue. */
  --project-accent: var(--accent);
  --project-accent-strong: var(--accent-strong);
  --article-accent: var(--accent);
  --article-accent-strong: var(--accent-strong);
}

:root[data-theme="light"] {
  color-scheme: light;

  --canvas: #F6F8FA;
  --surface: #FFFFFF;
  --subtle: #EEF2F5;
  --border: #D7DEE7;
  --border-subtle: #E8EDF3;

  --text: #17202A;          /* 15.45:1 on canvas */
  --muted: #5B6777;         /* 5.40:1 on canvas */
  --accent: #086F83;        /* 5.46:1 on canvas */
  --accent-strong: #065968;
  --focus: #086F83;

  --secondary: #6D55A3;
  --success: #1D7662;
  --warning: #8B6200;       /* 5.13:1 on canvas */
  --danger: #B42318;
  --attention-accent: #8B6200;

  --project-accent: var(--accent);
  --project-accent-strong: var(--accent-strong);
  --article-accent: var(--accent);
  --article-accent-strong: var(--accent-strong);
}
```

---

## 7. Conclusion & Next Steps

This audit's highest-value path is: fix the light warning-token contrast defect (`[OBJECTIVE / MUST-FIX]`), reduce competing decorative hues to one interactive accent plus meaningful semantic colors, unbox long-form Articles, and remove duplicate above-the-fold identity information. That combination preserves the Site's strong engineering foundation while making the proof of work feel calmer, more deliberate, and easier to scan.

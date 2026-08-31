# edgseu.dev

The domain language for the public `edgseu` identity, its owner-curated proof of work and writing, and the evidence required to release it truthfully.

## Language

### Identity

**Site**:
The public experience canonically identified as `edgseu`. It introduces the Person but does not use the Person’s name or GitHub identity as its brand.
_Avoid_: Website, application, Aman Bhushan Singh Site

**Canonical Site**:
The HTTPS Site at `edgseu.dev`; `www.edgseu.dev` is an alias to the same Site, not a separate destination.
_Avoid_: Production app, www Site

**Person**:
Aman Bhushan Singh, the Cloud and DevSecOps engineer introduced by the Site.
_Avoid_: Site brand, edgseu

**Site Owner**:
The person with authority to approve public editorial claims and operate the Site’s repository, domain, Discussions, and release process.
_Avoid_: Author, visitor, maintainer

**GitHub Profile**:
The public `h1zardian` identity that owns the repositories presented by the Site and supplies optional public facts and the profile avatar. It remains distinct from the Site and Person identities.
_Avoid_: Site, edgseu account

**Homepage**:
The recruiter-first overview that introduces the Person and routes visitors to Projects and Articles. It may borrow repository-document hierarchy without presenting itself as GitHub.
_Avoid_: Landing page, GitHub profile

**Interactive Terminal**:
The Homepage’s bounded signature introduction with a small curated command vocabulary. It is neither primary navigation nor a general-purpose shell.
_Avoid_: Shell, command palette, primary navigation

### Projects

**Project**:
A selected body of public work represented in the First Release by a Project Card that links directly to its canonical GitHub repository.
_Avoid_: Case study, Project page, repository

**Project Lifecycle**:
The real maintenance condition of a Project: Active, Maintained, Complete, or Archived. It is independent of whether the Site publishes the Project.
_Avoid_: Publication state, visibility, status

**Project Publication State**:
The Site Owner’s decision to expose or withhold a Project Card. Draft is withheld; Published is visible and must resolve to a public GitHub repository.
_Avoid_: Lifecycle, repository visibility

**Project Card**:
The owner-curated public summary of a Project, including its display copy, lifecycle, tags, destination, and order.
_Avoid_: Repository README, Project detail

**Repository Facts**:
Optional observations from public GitHub data, limited to language, pushed date, availability, visibility, rename, and archive truth. They may enrich or correct factual presentation but never supply editorial selection or copy.
_Avoid_: Project content, live statistics, editorial source

### Articles

**Article**:
An owner-authored long-form publication with a canonical reading page, generated section navigation, and an optional Article Discussion.
_Avoid_: Blog post, documentation page

**Article Publication State**:
The Site Owner’s decision to withhold or expose an Article. A Draft Article is locally reviewable at its eventual path; a Published Article is publicly listed and rendered.
_Avoid_: Scheduled, private, unlisted

**Article Path**:
The unique canonical trailing-slash location derived from an Article’s lowercase kebab-case slug.
_Avoid_: File path, Discussion URL

**Article Alias**:
A former Article Path retained as a static redirect after a deliberate rename. It preserves discoverability but is not a claim of an HTTP 301 or continuity of the old Discussion.
_Avoid_: Canonical path, migrated Article

**Article Outline**:
The generated H2/H3 navigation that orients readers within an Article while preserving ordinary browser hash and history behavior.
_Avoid_: Global navigation, table of contents authored in Markdown

**Article Discussion**:
The optional GitHub-backed conversation associated strictly with a Published Article’s normalized path. Its availability never determines whether the Article is available.
_Avoid_: Custom comments, Article content

**Article Sequence**:
The Newer and Older relationship between Published Articles, ordered by original publication date.
_Avoid_: Series, recommendation

### Editorial and release

**Owner Approval**:
Explicit confirmation from the Site Owner that public prose, display copy, lifecycle claims, destinations, or an Article are ready to publish. Presence in source or a Published value alone is not approval.
_Avoid_: Inferred approval, prototype evidence

**First Release**:
The initial public Site consisting of the Homepage, Projects index, Articles index, and Article pages. It excludes on-site Project details and broader publishing or application features.
_Avoid_: MVP, prototype, platform

**Release Gate**:
The deterministic checks that must pass before a Site artifact may deploy, covering content validity, build correctness, visitor behavior, accessibility automation, technical SEO, links, and resource budgets.
_Avoid_: Launch review, manual checklist

**Launch Review**:
The environment-sensitive real-browser, assistive-technology, performance, domain, comments, and public HTTPS evidence required to call the First Release launched.
_Avoid_: Release Gate, CI

**Quality Exception**:
A documented, owner-assigned, time-bounded acceptance of an eligible Launch Review miss. It cannot waive missing approved content, a keyboard trap, or inaccessible navigation.
_Avoid_: Permanent waiver, ignored failure

# Profile Taxonomy Research & Architecture

An evidence-backed analysis and design specification for structuring profile metadata (`focusAreas`, `shortSkills`, and `skills`) in `src/content/metadata.yaml`.

---

## 1. Executive Summary & Design Objective

The personal portfolio platform (`edgseu.dev`) presents professional identity across three distinct UI rendering surfaces:
1. **The Profile Rail (`ProfileRail.astro`)**: Monospace pill badges in the fixed sidebar beneath the identity block.
2. **The Terminal Identity Line (`src/lib/terminal.ts:formatWhoamiHtml`)**: Inline `skills: ...` field in the interactive `whoami` command.
3. **The Terminal Skills Grid (`src/lib/terminal.ts:formatSkillsGrid`)**: Two-column aligned monospace grid rendered by the interactive `skills` command.

The objective of this research is to replace placeholder or unbalanced taxonomy items with authentic, evidence-backed engineering terms derived directly from primary sources (professional experience, certifications, active projects, published technical writing, and bio narrative) while respecting the geometric and typographic constraints of the terminal and sidebar UI components.

---

## 2. Primary Source Evidence Inventory

Every proposed taxonomy term is grounded directly in the user's verified public engineering record.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             PRIMARY EVIDENCE SOURCES                             │
├────────────────────────┬────────────────────────┬────────────────────────────────┤
│ 1. Published Resume    │ 2. Projects Catalog    │ 3. Technical Articles & Bio    │
│ • Drona Pay (L2 Cloud) │ • DevSecOps Pipeline   │ • Cosign Supply Chain Security │
│ • AICTE (Azure Admin)  │ • Cowrie Sentinel Lab  │ • Prometheus/Grafana Mon.      │
│ • CompTIA Security+    │ • CI/CD & Build Pipe   │ • Terraform Immutable Infra    │
│ • Azure Admin (AZ-104) │ • Cluster Provisioning │ • Argo CD Declarative GitOps   │
│ • Google Cybersecurity │ • Sentinel DShield Lab │ • Verifiable DevSecOps Pipe    │
└────────────────────────┴────────────────────────┴────────────────────────────────┘
```

### 2.1 Professional Experience & Certifications (Published Resume)
- **Current / Recent Role**: L2 Cloud Infrastructure Associate Engineer at Drona Pay (May 2024 – July 2026).
  - *Focus*: Infrastructure troubleshooting, production AWS security incident response, remediation of 20+ CIS-aligned audit findings, SSO/PIM/JIT privilege elevation, GitLab CI security gates (Checkov, Gitleaks, Trivy).
- **Previous Role**: Azure Cloud Administrator Intern at AICTE (May 2022 – Feb 2024).
  - *Focus*: Azure Monitor & Log Analytics Workspace monitoring, Azure VNets/NSGs, Azure RBAC policies for 1,000+ users, cost optimization.
- **Certifications**:
  - CompTIA Security+ (SY0-701)
  - Microsoft Certified: Azure Administrator Associate (AZ-104)
  - Google Cybersecurity Professional Certificate
  - Cisco Splunk for AIOps (CAIOP)
  - Microsoft Certified: Azure Security Engineer Associate (AZ-500, in progress)
- **Technical Domains in Resume**:
  - *Cloud & IaC*: Azure, AWS, Terraform, Ansible, Docker, Buildah, Linux (Ubuntu/RHEL), Bash, Python
  - *Containers & GitOps*: Kubernetes (EKS/AKS), Helm, Argo CD
  - *DevSecOps & Supply Chain*: GitHub Actions, SBOM (Syft), Image Signing (Cosign), Trivy, Bandit, Checkov, Gitleaks
  - *Identity & Governance*: Microsoft Entra ID, Azure RBAC, PIM, Just-In-Time (JIT) Access, AWS IAM/IRSA, CIS Benchmarks, NIST CSF
  - *SIEM & Observability*: Microsoft Sentinel, Azure Monitor, Log Analytics, AWS CloudWatch, Prometheus, Grafana

### 2.2 Portfolio Projects Catalog (`src/content/projects.yaml`)
1. **DevSecOps Pipeline Project** (Pinned / Active):
   - *Stack*: AWS, EKS, Terraform, Argo CD, GitHub Actions, Kyverno, Cosign, Trivy, Prometheus, Grafana.
   - *Core*: Supply chain security (SLSA-aligned), keyless Cosign image signing, Kyverno admission control, private VPC/EKS.
2. **Cowrie Sentinel Lab** (Maintained):
   - *Stack*: Azure, Microsoft Sentinel, Cowrie, KQL, Log Analytics, Terraform.
   - *Core*: Honeypot telemetry streaming via CEF/rsyslog into Log Analytics, custom KQL MITRE ATT&CK detection rules.
3. **CI/CD Pipeline Project** (Active):
   - *Stack*: CI/CD, GitHub Actions, Docker, Security scanning (Bandit, pip-audit, Trivy, Gitleaks).
4. **Cluster Provisioning Pipeline** (Active):
   - *Stack*: Terraform, Kubernetes, Ansible, Cloud automation.
5. **Container Image Build Pipeline** (Maintained):
   - *Stack*: Docker, Containers, Cosign, Trivy, multi-architecture hardening.
6. **Sentinel DShield Honeypot Lab** (Maintained):
   - *Stack*: Azure, Microsoft Sentinel, Threat intelligence, KQL.
7. **DevOps Practice Tasks** (Complete):
   - *Stack*: Linux, Docker, Kubernetes, Automation.
8. **DevOps Engineering Notebook** (Active):
   - *Stack*: Architecture diagrams, runbooks, cloud operational notes.

### 2.3 Published Technical Writing (`src/content/articles/`)
1. `securing-container-supply-chains-with-cosign`: Cryptographic container image signing and admission policy verification in Kubernetes clusters.
2. `kubernetes-observability-with-prometheus`: Establishing actionable metrics, service monitors, and cluster alerts for production Kubernetes workloads.
3. `immutable-infrastructure-with-terraform`: Designing reproducible cloud environments with modular Terraform patterns and state isolation.
4. `gitops-workflow-with-argo-cd`: Automating continuous deployment, drift detection, and automated rollback for Kubernetes manifests.
5. `building-a-devsecops-pipeline`: A practical approach to making security controls visible, repeatable, and useful from commit to deployment.

### 2.4 Bio Narrative & Stated Value Proposition (`src/content/bio.md`)
> *"I build and document cloud infrastructure, GitOps delivery, and security automation... The projects below show the current focus across AWS, Azure, Kubernetes, infrastructure as code, observability, and software supply-chain controls."*

---

## 3. UI Seams, Architecture & Layout Constraints

The three metadata lists serve three distinct cognitive and visual layers in the UI.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              METADATA PRESENTATION TIERS                               │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ Tier 1: Focus Areas      │ Tier 2: Short Skills        │ Tier 3: Skills Grid           │
│ (`profile.focusAreas`)   │ (`profile.shortSkills`)     │ (`profile.skills`)            │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ • Surface: Profile Rail  │ • Surface: Terminal whoami  │ • Surface: Terminal `skills`  │
│ • Element: .focus-list li│ • Element: Inline monospace │ • Element: 2-column text grid │
│ • Role: High-level pillar│ • Role: Anchor platforms    │ • Role: Concrete tooling inventory │
│ • Count: 3 to 5 items    │ • Count: 4 to 6 items       │ • Count: 10 to 14 items (even)│
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

### 3.1 ProfileRail Badge Stream (`focusAreas`)
- **Rendering**: Rendered inside `src/components/ProfileRail.astro` as `<ul class="focus-list" aria-label="Focus areas">`.
- **CSS Styling** (`src/styles/global.css`):
  - `display: flex; flex-wrap: wrap; gap: 0.4rem;`
  - Font: `var(--font-mono)`, `font-size: 0.75rem`, `padding: 0.2rem 0.55rem;`
  - Container: Sidebar width `var(--sidebar-width)` (approx. 240px–280px on desktop; full-width on mobile cards).
- **Constraints**:
  - Should contain **3 to 5 items**.
  - Item string length should be concise (10–22 characters) to wrap into 2–3 aesthetically balanced rows without awkward orphan words.
  - Must represent **disciplines/domains**, not individual point tools (e.g., `DevSecOps`, not `Trivy`).

### 3.2 Terminal Whoami Summary Line (`shortSkills`)
- **Rendering**: Rendered inside `src/lib/terminal.ts:formatWhoamiHtml` as:
  ```html
  <span class="t-key">skills      </span><span class="t-val">${profile.shortSkills.map(escapeHtml).join(' · ')}</span>
  ```
- **Visual Output**:
  ```text
  skills      AWS · Azure · Kubernetes · Terraform · DevSecOps
  ```
- **Constraints**:
  - Should contain **4 to 6 foundational platforms/methodologies**.
  - Serves as the executive summary of the developer's core capability stack.
  - Separated by middle dots (` · `), requiring short, punchy terms (3–14 characters) so the line fits within standard terminal widths (60–80 chars) without premature multi-line text wrapping on mobile screens.

### 3.3 Terminal Skills Grid Command (`skills`)
- **Rendering**: Formatted by `src/lib/terminal.ts:formatSkillsGrid(items, columns = 2, gap = 4)`.
- **Formatting Algorithm**:
  ```typescript
  const maxLen = Math.max(...items.map((s) => s.length));
  const colWidth = maxLen + gap; // gap = 4
  // Row = item[0].padEnd(colWidth) + item[1]
  ```
- **Constraints**:
  - Number of items should be **even** (10, 12, or 14 items) so the 2-column grid is completely filled with no trailing orphan entry in the left column.
  - Maximum string length across all items determines `colWidth`.
    - If `maxLen` is ~18 chars, `colWidth` is 22 chars, and total grid line width is ~40 chars.
    - If `maxLen` is ~24 chars, `colWidth` is 28 chars, and total grid line width is ~52 chars.
  - Total line length should comfortably fit inside mobile terminal containers (~320px viewport width equates to approx 36–42 monospace characters at 0.8rem; desktop easily accommodates 60+ chars). Keeping `colWidth` around 20–24 chars ensures pristine cross-device legibility.
  - Must represent **concrete, verifiable technologies, tools, and platforms** directly substantiated by projects and resume experience.

### 3.4 Data Validation Schema (`src/lib/profile.ts`)
- The metadata schema enforces:
  ```typescript
  const uniqueList = z.array(requiredText).min(1, 'must contain at least one value')
    .superRefine((values, context) => {
      // Case-insensitive uniqueness check
    });
  ```
- Rules:
  - All items must be unique (case-insensitive).
  - No empty or whitespace-only strings.
  - `metadata.yaml` uses `.strict()` validation; no unregistered keys allowed.

---

## 4. Curated Taxonomy Options

Below are four distinct, professionally curated options designed to highlight different aspects of the engineer's profile while satisfying all UI layout constraints.

---

### Option 1: Cloud Security & DevSecOps Platform (Recommended)

**Focus**: Highlights supply chain security, immutable infrastructure, Kubernetes cluster hardening, policy-as-code, and SIEM/detection engineering. This option aligns tightly with the pinned EKS DevSecOps project, the Cosign article, and professional experience at Drona Pay.

#### YAML Specification
```yaml
focusAreas:
  - Cloud Security
  - DevSecOps & GitOps
  - Infrastructure as Code
  - SIEM & Observability

shortSkills:
  - AWS
  - Azure
  - Kubernetes
  - Terraform
  - DevSecOps
  - GitOps

skills:
  - Terraform
  - Kubernetes
  - AWS (EKS)
  - Azure (AKS)
  - Argo CD
  - GitHub Actions
  - Cosign & Kyverno
  - Trivy & Gitleaks
  - Microsoft Sentinel
  - Prometheus & Grafana
```

#### Detailed Breakdown & Rationale
- **`focusAreas` (4 disciplines)**:
  - `Cloud Security`: Captures multi-cloud posture, CIS remediation (Drona Pay), and Security+ / AZ-500 foundation.
  - `DevSecOps & GitOps`: Connects the CI/CD pipeline scanning to automated deployment (Argo CD, SLSA).
  - `Infrastructure as Code`: Reflects modular Terraform practices across AWS and Azure environments.
  - `SIEM & Observability`: Reflects Sentinel detection engineering, KQL, and Prometheus/Grafana metrics.
- **`shortSkills` (6 anchor platforms)**:
  - `AWS`, `Azure`, `Kubernetes`, `Terraform`, `DevSecOps`, `GitOps`.
  - Concise, punchy anchors that summarize the entire technology stack in the `whoami` terminal header.
- **`skills` (10 concrete tools, 5 paired rows)**:
  - *Row 1 (Core IaC & Orchestration)*: `Terraform` (10 chars) | `Kubernetes` (10 chars)
  - *Row 2 (Multi-Cloud Managed K8s)*: `AWS (EKS)` (9 chars) | `Azure (AKS)` (11 chars)
  - *Row 3 (Delivery & Automation)*: `Argo CD` (7 chars) | `GitHub Actions` (14 chars)
  - *Row 4 (Supply Chain & Policy)*: `Cosign & Kyverno` (16 chars) | `Trivy & Gitleaks` (16 chars)
  - *Row 5 (SecOps & Monitoring)*: `Microsoft Sentinel` (18 chars) | `Prometheus & Grafana` (20 chars)

#### UI Layout & Visual Flow Metrics
- **Max String Length**: 20 characters (`Prometheus & Grafana`).
- **Calculated Column Width**: 24 characters (`maxLen + 4`).
- **Total Terminal Line Width**: 44 characters (fits cleanly on all mobile viewports).
- **Rendered Output Preview**:
  ```text
  Terraform               Kubernetes
  AWS (EKS)               Azure (AKS)
  Argo CD                 GitHub Actions
  Cosign & Kyverno        Trivy & Gitleaks
  Microsoft Sentinel      Prometheus & Grafana
  ```

---

### Option 2: DevSecOps & GitOps Delivery Focus

**Focus**: Spotlights software delivery lifecycle automation, shift-left vulnerability scanning, declarative Kubernetes continuous deployment, and build pipeline security. Emphasizes GitHub Actions, Argo CD, Cosign, and container tooling.

#### YAML Specification
```yaml
focusAreas:
  - DevSecOps Pipelines
  - GitOps & Delivery
  - Container Security
  - Cloud Infrastructure

shortSkills:
  - Kubernetes
  - Terraform
  - GitHub Actions
  - Argo CD
  - AWS & Azure

skills:
  - Terraform
  - Ansible
  - Kubernetes (EKS/AKS)
  - Docker & Buildah
  - GitHub Actions
  - GitLab CI
  - Argo CD
  - Helm
  - Cosign & Syft
  - Trivy & Checkov
  - Kyverno Policies
  - Prometheus
```

#### Detailed Breakdown & Rationale
- **`focusAreas` (4 disciplines)**:
  - `DevSecOps Pipelines`: Highlights automated CI scanning (Bandit, Checkov, Gitleaks, Trivy).
  - `GitOps & Delivery`: Highlights declarative synchronization and drift detection with Argo CD.
  - `Container Security`: Highlights SBOM generation, Cosign signing, and hardened container builds.
  - `Cloud Infrastructure`: Highlights declarative multi-cloud infrastructure backing the delivery path.
- **`shortSkills` (5 anchor platforms)**:
  - `Kubernetes`, `Terraform`, `GitHub Actions`, `Argo CD`, `AWS & Azure`.
- **`skills` (12 concrete tools, 6 paired rows)**:
  - Pair 1: `Terraform` / `Ansible` (IaC & Config)
  - Pair 2: `Kubernetes (EKS/AKS)` / `Docker & Buildah` (Container Orchestration & Engine)
  - Pair 3: `GitHub Actions` / `GitLab CI` (CI Automation Engines)
  - Pair 4: `Argo CD` / `Helm` (GitOps & Package Management)
  - Pair 5: `Cosign & Syft` / `Trivy & Checkov` (Supply Chain & Static Analysis)
  - Pair 6: `Kyverno Policies` / `Prometheus` (Admission Control & Metrics)

#### UI Layout & Visual Flow Metrics
- **Max String Length**: 20 characters (`Kubernetes (EKS/AKS)`).
- **Calculated Column Width**: 24 characters.
- **Total Terminal Line Width**: 40 characters.
- **Rendered Output Preview**:
  ```text
  Terraform               Ansible
  Kubernetes (EKS/AKS)    Docker & Buildah
  GitHub Actions          GitLab CI
  Argo CD                 Helm
  Cosign & Syft           Trivy & Checkov
  Kyverno Policies        Prometheus
  ```

---

### Option 3: Modern Cloud Systems & Detection Engineering

**Focus**: Highlights cloud infrastructure administration, SIEM telemetry pipelines, Microsoft Sentinel detection rules, honeypot telemetry, and incident investigation. Emphasizes Azure/AWS cloud systems, KQL, and security telemetry.

#### YAML Specification
```yaml
focusAreas:
  - Cloud Systems
  - Detection Engineering
  - SIEM & Telemetry
  - Identity & IAM
  - Security Automation

shortSkills:
  - Azure
  - AWS
  - Microsoft Sentinel
  - Terraform
  - Linux & KQL

skills:
  - Azure (Entra ID/PIM)
  - AWS (IAM/IRSA)
  - Microsoft Sentinel
  - Azure Log Analytics
  - KQL Detections
  - Cowrie Honeypots
  - Terraform IaC
  - Linux (Ubuntu/RHEL)
  - Azure Monitor
  - AWS CloudWatch
  - CIS Benchmarks
  - Gitleaks & Trivy
```

#### Detailed Breakdown & Rationale
- **`focusAreas` (5 disciplines)**:
  - `Cloud Systems`, `Detection Engineering`, `SIEM & Telemetry`, `Identity & IAM`, `Security Automation`.
  - Reflects the honeypot projects (Cowrie Sentinel Lab, Sentinel DShield Lab) and AICTE / Drona Pay enterprise security experience.
- **`shortSkills` (5 anchor platforms)**:
  - `Azure`, `AWS`, `Microsoft Sentinel`, `Terraform`, `Linux & KQL`.
- **`skills` (12 concrete tools, 6 paired rows)**:
  - Pair 1: `Azure (Entra ID/PIM)` / `AWS (IAM/IRSA)` (Identity Governance)
  - Pair 2: `Microsoft Sentinel` / `Azure Log Analytics` (SIEM Core)
  - Pair 3: `KQL Detections` / `Cowrie Honeypots` (Threat Detection & Deception)
  - Pair 4: `Terraform IaC` / `Linux (Ubuntu/RHEL)` (Infrastructure & OS)
  - Pair 5: `Azure Monitor` / `AWS CloudWatch` (Cloud Telemetry)
  - Pair 6: `CIS Benchmarks` / `Gitleaks & Trivy` (Compliance & Vulnerability Mgmt)

#### UI Layout & Visual Flow Metrics
- **Max String Length**: 20 characters (`Azure (Entra ID/PIM)`).
- **Calculated Column Width**: 24 characters.
- **Total Terminal Line Width**: 40 characters.
- **Rendered Output Preview**:
  ```text
  Azure (Entra ID/PIM)    AWS (IAM/IRSA)
  Microsoft Sentinel      Azure Log Analytics
  KQL Detections          Cowrie Honeypots
  Terraform IaC           Linux (Ubuntu/RHEL)
  Azure Monitor           AWS CloudWatch
  CIS Benchmarks          Gitleaks & Trivy
  ```

---

### Option 4: Balanced Multi-Cloud Practitioner (All-Rounder)

**Focus**: A comprehensive, harmonized taxonomy that balances cloud infrastructure, container orchestration, supply chain security, and observability across both Azure and AWS ecosystems without over-indexing on any single tool.

#### YAML Specification
```yaml
focusAreas:
  - Cloud Infrastructure
  - DevSecOps
  - GitOps
  - Observability & SIEM
  - Supply Chain Security

shortSkills:
  - AWS
  - Azure
  - Kubernetes
  - Terraform
  - GitOps
  - Sentinel

skills:
  - Terraform
  - Kubernetes
  - AWS (EKS)
  - Azure (AKS)
  - Argo CD
  - GitHub Actions
  - Cosign & Syft
  - Kyverno
  - Trivy & Gitleaks
  - Microsoft Sentinel
  - Prometheus
  - Grafana
```

#### Detailed Breakdown & Rationale
- **`focusAreas` (5 disciplines)**:
  - `Cloud Infrastructure`: Multi-cloud foundation across AWS and Azure.
  - `DevSecOps`: Automated security scanning in CI pipelines.
  - `GitOps`: Declarative continuous deployment with Argo CD.
  - `Observability & SIEM`: Metrics (Prometheus/Grafana) + SIEM (Microsoft Sentinel).
  - `Supply Chain Security`: Image signing (Cosign), SBOMs (Syft), and admission policy.
- **`shortSkills` (6 anchor platforms)**:
  - `AWS`, `Azure`, `Kubernetes`, `Terraform`, `GitOps`, `Sentinel`.
- **`skills` (12 concrete tools, 6 paired rows)**:
  - Pair 1: `Terraform` / `Kubernetes`
  - Pair 2: `AWS (EKS)` / `Azure (AKS)`
  - Pair 3: `Argo CD` / `GitHub Actions`
  - Pair 4: `Cosign & Syft` / `Kyverno`
  - Pair 5: `Trivy & Gitleaks` / `Microsoft Sentinel`
  - Pair 6: `Prometheus` / `Grafana`

#### UI Layout & Visual Flow Metrics
- **Max String Length**: 18 characters (`Microsoft Sentinel`).
- **Calculated Column Width**: 22 characters.
- **Total Terminal Line Width**: 37 characters (exceptionally compact and clean).
- **Rendered Output Preview**:
  ```text
  Terraform             Kubernetes
  AWS (EKS)             Azure (AKS)
  Argo CD               GitHub Actions
  Cosign & Syft         Kyverno
  Trivy & Gitleaks      Microsoft Sentinel
  Prometheus            Grafana
  ```

---

## 5. Comparative Evaluation & Decision Matrix

| Evaluation Criteria | Option 1 (Cloud Sec & DevSecOps) | Option 2 (DevSecOps Delivery) | Option 3 (Cloud Systems & Detection) | Option 4 (Balanced Multi-Cloud) |
| :--- | :--- | :--- | :--- | :--- |
| **Persona Match** | **Highest**: Matches bio, resume role, and top projects | Strong for CI/CD & pipeline roles | Strong for SOC / SecOps / Cloud Admin | High: Broadest appeal across engineering roles |
| **Primary Source Fidelity** | 100% cited from projects, articles, and resume | High focus on articles & CI projects | High focus on honeypot labs & AICTE exp | 100% balance across all 8 projects and 5 articles |
| **ProfileRail Badge Density** | 4 badges (2 lines, clean wrap) | 4 badges (2 lines, clean wrap) | 5 badges (2–3 lines) | 5 badges (2–3 lines) |
| **Terminal Whoami Width** | 56 chars (fits 1 line on desktop & tablet) | 50 chars (compact) | 48 chars (compact) | 54 chars (compact) |
| **Terminal Skills Grid Symmetry** | 10 items (5 perfect pairs, 44 ch width) | 12 items (6 pairs, 40 ch width) | 12 items (6 pairs, 40 ch width) | 12 items (6 pairs, 37 ch width) |
| **Cognitive Load** | Low (focused & sharp) | Moderate (tool-heavy) | Moderate (governance-heavy) | Low to Moderate (balanced) |

### Recommendation
- **Primary Recommendation**: **Option 1 (Cloud Security & DevSecOps Platform)** or **Option 4 (Balanced Multi-Cloud Practitioner)**.
- *Why*: Option 1 gives the sharpest, most cohesive narrative for an engineer specializing in cloud security automation, verifiable GitOps pipelines, and detection engineering. Option 4 provides the most comprehensive coverage across the full 8-project catalog.

---

## 6. Implementation & Verification Plan

### 6.1 Recommended Update to `src/content/metadata.yaml`
Applying **Option 1** or **Option 4** updates the metadata fields as follows:

```yaml
focusAreas:
  - Cloud Security
  - DevSecOps & GitOps
  - Infrastructure as Code
  - SIEM & Observability

shortSkills:
  - AWS
  - Azure
  - Kubernetes
  - Terraform
  - DevSecOps
  - GitOps

skills:
  - Terraform
  - Kubernetes
  - AWS (EKS)
  - Azure (AKS)
  - Argo CD
  - GitHub Actions
  - Cosign & Kyverno
  - Trivy & Gitleaks
  - Microsoft Sentinel
  - Prometheus & Grafana
```

### 6.2 Verification Checklist
1. **Schema Validation**:
   - Run `validateProfileFile()` or load profile via `src/lib/profile.ts` to verify `profileSchema.parse()` succeeds with zero Zod errors.
   - Verify case-insensitive uniqueness across all three arrays.
2. **Terminal Grid Verification**:
   - Execute the `skills` command in `src/lib/terminal.ts` and inspect `formatSkillsGrid(skills)` output.
   - Verify that column padding is uniform and no line exceeds 50 characters.
3. **UI Layout Verification**:
   - Inspect `ProfileRail.astro` badge layout on desktop (sidebar) and mobile (collapsed card).
   - Ensure badges wrap naturally without horizontal overflow.

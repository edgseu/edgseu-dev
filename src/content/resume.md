---
title: "Resume"
description: "Cloud and DevSecOps engineer resume: Azure and AWS infrastructure, Terraform, Kubernetes, GitOps, CI/CD security, and Microsoft Sentinel."
---

## PROFESSIONAL SUMMARY

Cloud & DevSecOps Engineer with 3+ years of experience securing and automating multi-cloud infrastructure across Azure and AWS using Terraform, Kubernetes, and GitOps. Focused on CI/CD security, IAM governance, observability, and incident investigation.

## TECHNICAL SKILLS

- **Cloud & IaC:** Azure, AWS, Terraform, Ansible, Docker, Buildah, Linux (Ubuntu/RHEL), Bash, Python
- **Containers & GitOps:** Kubernetes (EKS/AKS), Helm, Argo CD
- **DevSecOps & Supply Chain:** GitHub Actions, SBOM (Syft), Image Signing (Cosign), Trivy, Bandit, Checkov, Gitleaks
- **Identity & Governance:** Microsoft Entra ID, Azure RBAC, PIM, Just-In-Time (JIT) Access, AWS IAM/IRSA, CIS Benchmarks, NIST CSF
- **SIEM & Observability:** Microsoft Sentinel, Azure Monitor, Log Analytics, AWS CloudWatch, Prometheus, Grafana

## PROFESSIONAL EXPERIENCE

### L2 Cloud Infrastructure Associate Engineer

**Drona Pay, Mumbai** · May 2024 – July 2026

- Investigated and resolved infrastructure, deployment, and security incidents across enterprise environments, improving service restoration and operational reliability.
- Analyzed quarterly external audits across production AWS environments, tracked remediation of 20+ CIS-aligned findings, and documented exceptions where controls conflicted with operational requirements.
- Supported SSO, privileged-access, and Just-in-Time access implementations across client and internal cloud environments, applying least-privilege and controlled-elevation principles.
- Supported GitLab CI security gates using Checkov, Gitleaks, and Trivy to identify infrastructure misconfigurations, leaked secrets, and vulnerable packages before production release.

### Azure Cloud Administrator Intern

**AICTE, New Delhi** · May 2022 – Feb 2024

- Monitored enterprise cloud workloads across Azure tenants using Azure Monitor and Log Analytics Workspace, improving incident turnaround time by 25%.
- Administered Azure VNets, NSGs, and IAM RBAC policies for 1,000+ internal users adhering to least-privilege principles.
- Audited idle cloud resources and unattached storage volumes, optimizing monthly infrastructure overhead by 18%.

## KEY PROJECTS

### Secure DevSecOps Platform

[github.com/edgseu/devsecops-pipeline-project](https://github.com/edgseu/devsecops-pipeline-project)

AWS, EKS, Terraform, GitHub Actions, Kyverno, Argo CD

- Built a Terraform-managed AWS EKS infrastructure with private nodes, encrypted RDS databases, and secured VPC networking.
- Engineered an automated SLSA-aligned GitHub Actions CI pipeline integrated with modern security scanners including Gitleaks, Bandit, pip-audit, and Trivy.
- Secured the software supply chain by utilizing Syft for SBOM generation, Cosign for keyless image signing, and Argo CD for GitOps deployments using immutable image digests.
- Enforced strict runtime defense-in-depth policies using Kyverno to mandate signed images, non-root user execution, and restricted image registries.

### Cloud Sentinel & Honeypot Lab

[github.com/edgseu/cowrie-sentinel-lab](https://github.com/edgseu/cowrie-sentinel-lab)

Azure, Microsoft Sentinel, KQL, Cowrie

- Provisioned an automated Cowrie SSH/Telnet honeypot utilizing Terraform, isolated in a private subnet with strict NSG egress rules.
- Developed an end-to-end security telemetry pipeline streaming Cowrie CEF event logs through rsyslog and Azure Monitor Agent into a Log Analytics workspace.
- Authored custom KQL scheduled detection rules in Microsoft Sentinel mapped to MITRE ATT&CK to flag brute-force attacks.

## EDUCATION

### B.Tech in Computer Science & Engineering

**Technocrats Institute of Technology (Excellence)** · 2018 – 2022

## CERTIFICATIONS

- CompTIA Security+ (SY0-701)
- Azure Administrator Associate (AZ-104)
- Azure Security Engineer Associate (AZ-500, In Progress)
- Google Cybersecurity Professional Certificate
- Cisco Splunk for AIOps (CAIOP)

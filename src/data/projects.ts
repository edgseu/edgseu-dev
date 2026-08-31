export type ProjectLifecycle = 'Active' | 'Maintained' | 'Complete' | 'Archived';
export type PublicationState = 'Draft' | 'Published';

export interface Project {
  id: string;
  title: string;
  summary: string;
  url: `https://github.com/${string}/${string}`;
  state: PublicationState;
  lifecycle: ProjectLifecycle;
  tags: readonly string[];
  order: number;
}

export const projects: readonly Project[] = [
  {
    id: 'devsecops-pipeline-project',
    title: 'DevSecOps Pipeline Project',
    summary:
      'Security-first AWS EKS GitOps portfolio: Terraform, Argo CD, GitHub Actions, Kyverno, Cosign, Trivy, Prometheus, and Grafana.',
    url: 'https://github.com/h1zardian/devsecops-pipeline-project',
    state: 'Published',
    lifecycle: 'Active',
    tags: ['AWS', 'EKS', 'GitOps', 'Terraform', 'Supply chain security'],
    order: 1,
  },
  {
    id: 'cowrie-sentinel-lab',
    title: 'Cowrie Sentinel Lab',
    summary:
      'Azure Cowrie SSH/Telnet honeypot home lab with Microsoft Sentinel, Log Analytics, KQL, and Terraform.',
    url: 'https://github.com/h1zardian/cowrie-sentinel-lab',
    state: 'Published',
    lifecycle: 'Maintained',
    tags: ['Azure', 'Microsoft Sentinel', 'Cowrie', 'KQL', 'Terraform'],
    order: 2,
  },
] as const;


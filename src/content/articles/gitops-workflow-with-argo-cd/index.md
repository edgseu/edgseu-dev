---
title: Declarative GitOps workflows with Argo CD
summary: Automating continuous deployment, drift detection, and automated rollback for Kubernetes manifests.
state: Published
publishedAt: 2026-08-18
tags:
  - GitOps
  - Argo CD
  - Kubernetes
  - DevOps
---

GitOps defines the desired state of a Kubernetes cluster entirely within Git repositories. Argo CD continuously compares the running cluster state against the declared manifests in Git, reconciling any detected configuration drift.

## Reconciliation architecture

Argo CD runs directly inside the cluster, polling Git repositories or listening for webhooks to apply new application versions without storing cluster credentials in external CI systems.

| Component | Function | Sync interval |
| --- | --- | --- |
| Repo Server | Clones Git repositories and generates manifests | On-demand |
| Application Controller | Compares live cluster state with Git target state | 3 minutes |
| API Server | Exposes RBAC-controlled interface and metrics | Real-time |

### Declaring an Argo CD Application

Applications are themselves declared as Kubernetes Custom Resources:

```yaml "application.yaml"
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: cloud-service
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/h1zardian/cloud-service
    targetRevision: main
    path: manifests/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Safe rollback strategies

When a defect is introduced in production, reverting the commit in Git automatically triggers Argo CD to reconcile the cluster back to the last known stable release.

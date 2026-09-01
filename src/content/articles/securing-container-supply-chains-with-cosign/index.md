---
title: Securing container supply chains with Sigstore Cosign
summary: Cryptographic container image signing and admission policy verification in Kubernetes clusters.
state: Published
publishedAt: 2026-08-22
tags:
  - Security
  - Containers
  - Cosign
  - Supply chain
---

Software supply-chain integrity ensures that workloads running inside production clusters match the exact commits and builds reviewed by the team. Cosign provides keyless cryptographic signing directly alongside OCI container registries.

## The keyless signing lifecycle

Using OpenID Connect (OIDC) identity tokens from GitHub Actions, Cosign generates short-lived signing certificates backed by the Sigstore Fulcio certificate authority and records provenance into the Rekor transparency log.

| Stage | Actor | Evidence produced |
| --- | --- | --- |
| Build step | GitHub Actions runner | Container image digest |
| Sign step | Fulcio & OIDC | Cryptographic signature in OCI |
| Admission step | Kyverno / Gatekeeper | Verification of signed issuer identity |

### Signing an image in CI

The signing step runs after container scanning passes:

```bash "sign-image.sh"
cosign sign --yes "ghcr.io/h1zardian/api-service@sha256:abcd1234"
```

## Admission controller verification

Deploying signed images is only effective when the Kubernetes admission controller actively rejects unsigned or untrusted digests before container runtime creation.

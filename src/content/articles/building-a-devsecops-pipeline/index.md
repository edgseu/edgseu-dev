---
title: Building a verifiable DevSecOps delivery path
summary: A practical approach to making security controls visible, repeatable, and useful from commit to deployment.
state: Published
publishedAt: 2026-08-31
tags:
  - DevSecOps
  - GitOps
  - Supply chain security
aliases:
  - /articles/verifiable-devsecops-delivery/
---

A delivery pipeline is trustworthy when every important claim can be checked. “The image was scanned,” “the manifest was reviewed,” and “the deployed workload matches the approved source” should be evidence, not convention.

This article describes a portable path for turning those claims into repeatable controls. The goal is not to collect tools. It is to keep the relationship between source, artifact, policy, and runtime easy to inspect.

## Start with an explicit trust boundary

A useful pipeline begins by deciding what the build is allowed to trust. Source control establishes the reviewed input. The build runner creates an artifact. A registry stores that artifact by digest. The deployment controller then reconciles a declared digest into the cluster.

| Boundary | Evidence | Failure behavior |
| --- | --- | --- |
| Source to build | Reviewed commit SHA | Stop before packaging |
| Build to registry | Signed immutable digest | Reject unsigned artifacts |
| Registry to deployment | Digest in reviewed configuration | Refuse mutable tags |
| Deployment to runtime | Admission policy result | Deny nonconforming workloads |

> A control that quietly degrades into a warning is not enforcing the boundary it describes.

### Keep credentials out of the artifact path

Prefer short-lived workload identity over stored cloud keys. Give each job only the permissions needed for its stage, and keep deployment authority separate from artifact creation.

The resulting workflow is easier to reason about:

1. A pull request runs deterministic checks without deployment permission.
2. A protected branch build creates and scans the image.
3. The build signs the digest through workload identity.
4. A configuration change records that digest.
5. GitOps reconciliation deploys the reviewed state.

## Make one artifact carry the evidence

Build once. Promote the same digest. Rebuilding for each environment creates several artifacts from one commit and weakens the audit trail.

```yaml "policy-check.yaml"
name: verify
on: [pull_request]
permissions:
  contents: read
jobs:
  policy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - run: trivy config --exit-code 1 .
```

The exact scanner can change. The durable contract is that a policy failure returns a failing status before deployment becomes possible.

### Record facts, not screenshots

Machine-readable results belong beside the workflow run and artifact metadata. Useful facts include:

- the source commit;
- the immutable image digest;
- the scanner and policy versions;
- the signature identity; and
- the deployment revision.

Screenshots can help explain a review, but they are not a reproducible control.

## Put policy at two different seams

CI policy gives fast author feedback. Admission policy protects the cluster when an artifact reaches it through another path. The controls overlap deliberately, but they answer different questions.

- **CI:** Is the proposed configuration acceptable?
- **Admission:** Is this exact request allowed to run here?

A Kyverno or Gatekeeper rule can reject privileged containers, mutable image tags, or missing resource limits. Keep the message actionable: identify the rejected field and the accepted alternative.

## Treat observability as part of delivery

A deployment is not complete merely because reconciliation succeeded. Capture whether the workload becomes ready, whether error rates change, and whether policy denials rise after the release.

A small operational loop is enough:

1. expose service and reconciliation health;
2. alert on user-visible failure rather than every transient event;
3. link alerts back to the deployed revision; and
4. revert through the same declared delivery path.

This keeps rollback ordinary. The previous reviewed configuration is restored, reconciliation applies it, and the evidence chain remains intact.

## Review the path as a system

Individual tools can all report success while the delivery path remains weak. Review the complete sequence periodically:

- Can a pull request obtain deployment authority?
- Can a mutable tag replace an approved image?
- Can an unsigned digest pass admission?
- Can a direct cluster change survive reconciliation?
- Can an operator identify the running source revision?

The strongest result is a short, boring path with explicit failure states. Security then becomes part of how delivery works, not a separate ceremony added after it.[^portable]

[^portable]: The controls described here rely on open formats and ordinary repository files so the evidence remains useful when a particular CI, registry, or policy product changes.

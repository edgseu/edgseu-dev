---
title: Kubernetes observability with Prometheus and Grafana
summary: Establishing actionable metrics, service monitors, and cluster alerts for production Kubernetes workloads.
state: Published
publishedAt: 2026-08-28
pinned: true
tags:
  - Kubernetes
  - Prometheus
  - Observability
  - Grafana
---

Effective cluster observability focuses on actionable signals rather than noisy dashboards. When an incident occurs, metrics should immediately isolate whether the failure originates in the infrastructure, ingress controller, or application runtime.

## Core telemetry boundaries

Prometheus collects operational metrics by pulling time-series data from configured `/metrics` endpoints. In Kubernetes, the Prometheus Operator standardizes this scraping mechanism through custom resources.

| Telemetry layer | Collection target | Primary metrics |
| --- | --- | --- |
| Node metrics | `node-exporter` | CPU saturation, memory pressure, disk I/O |
| Cluster control plane | `kube-state-metrics` | Pod restarts, pending deployments, quota limits |
| Workload metrics | Application pods | Request latency, HTTP error rate, active connections |

### Declaring ServiceMonitors

Instead of static scrape configs, use declarative `ServiceMonitor` resources managed within your application GitOps repository:

```yaml "servicemonitor.yaml"
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: api-service-monitor
  labels:
    release: prometheus-stack
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: api-gateway
  endpoints:
    - port: metrics
      interval: 15s
```

## Designing actionable alert rules

Alerts should notify on symptoms that affect visitors, not internal implementation quirks. Alert on high latency percentiles (p99) and elevated 5xx error rates before investigating individual container restarts.

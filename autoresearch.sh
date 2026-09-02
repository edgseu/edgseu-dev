#!/usr/bin/env bash
set -euo pipefail

# Ensure offline deterministic mode
export GITHUB_ENRICHMENT=off

# 1. Run content and schema validation
pnpm validate > /dev/null

# 2. Run the deterministic architectural benchmark
pnpm exec tsx scripts/benchmark-architecture.ts

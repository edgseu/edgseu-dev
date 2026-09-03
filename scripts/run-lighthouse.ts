import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import { publishedArticles } from '../tests/helpers/test-articles';

interface Measurement {
  performance: number;
  lcp: number;
  cls: number;
  tbt: number;
}

const routes = ['/', '/projects/', '/articles/'];
if (publishedArticles.length > 0 && publishedArticles[0]) {
  routes.push(publishedArticles[0].path);
}

const artifactDirectory = 'artifacts';
mkdirSync(artifactDirectory, { recursive: true });
const server = spawn('pnpm', ['astro', 'preview', '--host', '127.0.0.1', '--port', '4321'], {
  stdio: 'ignore',
  detached: false,
});

for (let attempt = 0; attempt < 50; attempt += 1) {
  try {
    const response = await fetch('http://127.0.0.1:4321/');
    if (response.ok) break;
  } catch {
    if (attempt === 49) throw new Error('Astro preview did not become ready');
  }
  await delay(200);
}

const summaries: Record<string, Measurement & { reviewRequired: boolean }> = {};
try {
  for (const route of routes) {
    const runs: Measurement[] = [];
    for (let run = 1; run <= 3; run += 1) {
      const report = join(artifactDirectory, `lighthouse-${route.replaceAll('/', '-') || 'home'}-${run}.json`);
      execFileSync('pnpm', [
        'exec', 'lighthouse', `http://127.0.0.1:4321${route}`,
        '--quiet', '--chrome-flags=--headless --no-sandbox', '--only-categories=performance',
        '--output=json', `--output-path=${report}`,
      ], { env: { ...process.env, CHROME_PATH: chromium.executablePath() }, stdio: 'inherit' });
      const result = JSON.parse(readFileSync(report, 'utf8')) as {
        categories: { performance: { score: number } };
        audits: Record<string, { numericValue: number }>;
      };
      runs.push({
        performance: result.categories.performance.score * 100,
        lcp: result.audits['largest-contentful-paint']?.numericValue ?? Number.POSITIVE_INFINITY,
        cls: result.audits['cumulative-layout-shift']?.numericValue ?? Number.POSITIVE_INFINITY,
        tbt: result.audits['total-blocking-time']?.numericValue ?? Number.POSITIVE_INFINITY,
      });
      rmSync(report);
    }
    const median = (field: keyof Measurement): number => runs.map((measurement) => measurement[field]).toSorted((a, b) => a - b)[1] ?? Number.POSITIVE_INFINITY;
    const summary = {
      performance: median('performance'),
      lcp: median('lcp'),
      cls: median('cls'),
      tbt: median('tbt'),
      reviewRequired: false,
    };
    summary.reviewRequired = summary.performance < 90 || summary.lcp > 2500 || summary.cls > 0.1 || summary.tbt > 200;
    summaries[route] = summary;
  }
} finally {
  server.kill('SIGTERM');
}

const evidence = {
  generatedAt: new Date().toISOString(),
  environment: `${process.platform} ${process.arch}`,
  chrome: chromium.executablePath(),
  runsPerRoute: 3,
  targets: { performance: 90, lcpMilliseconds: 2500, cls: 0.1, tbtMilliseconds: 200 },
  routes: summaries,
};
writeFileSync(join(artifactDirectory, 'lighthouse-summary.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));

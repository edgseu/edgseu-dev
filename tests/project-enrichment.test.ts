import assert from 'node:assert/strict';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const publicRepository = (id: string, archived = false) => ({
  status: 200,
  body: {
    full_name: `h1zardian/${id}`,
    html_url: `https://github.com/h1zardian/${id}`,
    visibility: 'public',
    private: false,
    archived,
    language: 'HCL',
    pushed_at: '2026-08-30T12:00:00Z',
  },
});

function buildWith(name: string, environment: NodeJS.ProcessEnv): { status: number | null; output: string; directory: string } {
  const directory = `dist-${name}`;
  rmSync(directory, { recursive: true, force: true });
  const result = spawnSync('pnpm', ['astro', 'build', '--outDir', directory], {
    cwd: process.cwd(),
    env: { ...process.env, ...environment },
    encoding: 'utf8',
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}`, directory };
}

test('enrichment outage does not hollow out or fail the Project build', () => {
  const result = buildWith('project-outage', { GITHUB_ENRICHMENT: 'off' });
  assert.equal(result.status, 0, result.output);
  const projects = readFileSync(join(result.directory, 'projects/index.html'), 'utf8');
  assert.match(projects, /DevSecOps Pipeline Project/);
  assert.doesNotMatch(projects, /project-card-meta/);
  rmSync(result.directory, { recursive: true, force: true });
});

test('GitHub archive truth overrides the curated lifecycle', () => {
  const fixture = 'project-enrichment-fixture.json';
  writeFileSync(fixture, JSON.stringify({
    'devsecops-pipeline-project': publicRepository('devsecops-pipeline-project', true),
    'cowrie-sentinel-lab': publicRepository('cowrie-sentinel-lab'),
  }));
  const result = buildWith('project-archived', { GITHUB_ENRICHMENT_FILE: fixture });
  rmSync(fixture);
  assert.equal(result.status, 0, result.output);
  const projects = readFileSync(join(result.directory, 'projects/index.html'), 'utf8');
  assert.match(projects, /HCL/);
  assert.match(projects, /2026-08-30/);
  rmSync(result.directory, { recursive: true, force: true });
});

test('dead Published repository fails production with an actionable error', () => {
  const fixture = 'project-enrichment-fixture.json';
  writeFileSync(fixture, JSON.stringify({
    'devsecops-pipeline-project': { status: 404 },
    'cowrie-sentinel-lab': publicRepository('cowrie-sentinel-lab'),
  }));
  const result = buildWith('project-dead', { GITHUB_ENRICHMENT_FILE: fixture });
  rmSync(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Published Project repository is private, deleted, or inaccessible/);
  rmSync(result.directory, { recursive: true, force: true });
});

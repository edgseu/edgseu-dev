import assert from 'node:assert/strict';
import test from 'node:test';
import type { Project } from '../src/data/projects';
import {
  enrichProject,
  enrichProjects,
  FixtureMetadataProvider,
  loadProjectCatalog,
  OfflineMetadataProvider,
  selectHomepageProjects,
  sortPublishedProjects,
  validateProjectCatalog,
} from '../src/lib/projects';

const baseProject: Project = {
  id: 'devsecops-pipeline-project',
  title: 'DevSecOps Pipeline Project',
  summary: 'Security-first AWS EKS GitOps portfolio.',
  url: 'https://github.com/h1zardian/devsecops-pipeline-project',
  state: 'Published',
  lifecycle: 'Active',
  tags: ['AWS', 'EKS', 'GitOps'],
  order: 1,
  pinned: true,
};

const publicRepository = (id: string, archived = false) => ({
  status: 200,
  body: {
    full_name: `h1zardian/${id}`,
    html_url: `https://github.com/h1zardian/${id}`,
    visibility: 'public',
    private: false,
    archived,
    language: 'HCL',
    languages: ['HCL', 'Dockerfile'],
    pushed_at: '2026-08-30T12:00:00Z',
  },
});

test('enrichment outage / offline provider leaves curated Project intact without enrichment', async () => {
  const provider = new OfflineMetadataProvider();
  const enriched = await enrichProject(baseProject, provider);
  assert.equal(enriched.id, baseProject.id);
  assert.equal(enriched.lifecycle, 'Active');
  assert.equal(enriched.enrichment, undefined);
});
test('importing the Project catalog does not access repository metadata', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error('Project catalog import attempted network access');
  }) as typeof fetch;

  try {
    // A cache-busting runtime specifier is required to exercise fresh module evaluation.
    const modulePath = `../src/lib/projects.ts?audit=${Date.now()}`;
    await import(modulePath);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('loadProjectCatalog validates, enriches, and selects through one interface', async () => {
  const secondProject: Project = {
    ...baseProject,
    id: 'cowrie-sentinel-lab',
    title: 'Cowrie Sentinel Lab',
    url: 'https://github.com/h1zardian/cowrie-sentinel-lab',
    order: 2,
  };
  const catalog = await loadProjectCatalog({
    catalog: [baseProject, secondProject],
    provider: new OfflineMetadataProvider(),
  });

  assert.deepEqual(
    catalog.publishedProjects.map((project) => project.id),
    ['devsecops-pipeline-project', 'cowrie-sentinel-lab'],
  );
  assert.deepEqual(catalog.homepageProjects, catalog.publishedProjects);
  assert.equal(catalog.isHomepageProjectGrid2x2, false);
});

test('enrichProjects processes multiple projects concurrently', async () => {
  const provider = new FixtureMetadataProvider({
    'devsecops-pipeline-project': publicRepository('devsecops-pipeline-project', true),
  });
  const results = await enrichProjects([baseProject], provider);
  assert.equal(results.length, 1);
  assert.equal(results[0]?.lifecycle, 'Archived');
});

test('GitHub archive truth overrides the curated lifecycle and attaches metadata', async () => {
  const provider = new FixtureMetadataProvider({
    'devsecops-pipeline-project': publicRepository('devsecops-pipeline-project', true),
  });
  const enriched = await enrichProject(baseProject, provider);
  assert.equal(enriched.lifecycle, 'Archived');
  assert.equal(enriched.enrichment?.language, 'HCL');
  assert.deepEqual(enriched.enrichment?.languages, ['HCL', 'Dockerfile']);
  assert.equal(enriched.enrichment?.pushedAt, '2026-08-30');
});

test('dead Published repository (404) throws an actionable error', async () => {
  const provider = new FixtureMetadataProvider({
    'devsecops-pipeline-project': { status: 404 },
  });
  await assert.rejects(
    async () => enrichProject(baseProject, provider),
    /Published Project repository is private, deleted, or inaccessible/,
  );
});

test('private repository throws an actionable error', async () => {
  const provider = new FixtureMetadataProvider({
    'devsecops-pipeline-project': {
      status: 200,
      body: {
        full_name: 'h1zardian/devsecops-pipeline-project',
        html_url: 'https://github.com/h1zardian/devsecops-pipeline-project',
        visibility: 'private',
        private: true,
      },
    },
  });
  await assert.rejects(
    async () => enrichProject(baseProject, provider),
    /Published Project repository is not public/,
  );
});

test('renamed or moved repository throws an actionable error', async () => {
  const provider = new FixtureMetadataProvider({
    'devsecops-pipeline-project': {
      status: 200,
      body: {
        full_name: 'other-user/renamed-project',
        html_url: 'https://github.com/other-user/renamed-project',
        visibility: 'public',
        private: false,
      },
    },
  });
  await assert.rejects(
    async () => enrichProject(baseProject, provider),
    /Published Project repository was renamed or moved/,
  );
});

test('sortPublishedProjects puts pinned projects first then sorts by order', () => {
  const catalog: Project[] = [
    { ...baseProject, id: 'unpinned-1', order: 1, pinned: false },
    { ...baseProject, id: 'pinned-2', order: 2, pinned: true },
    { ...baseProject, id: 'pinned-1', order: 1, pinned: true },
    { ...baseProject, id: 'draft-item', order: 0, state: 'Draft' },
  ];
  const sorted = sortPublishedProjects(catalog);
  assert.deepEqual(
    sorted.map((p) => p.id),
    ['pinned-1', 'pinned-2', 'unpinned-1'],
  );
});

test('selectHomepageProjects scales selection and grid mode based on pinned count', () => {
  const p1 = { ...baseProject, id: 'p1', pinned: true };
  const p2 = { ...baseProject, id: 'p2', pinned: true };
  const p3 = { ...baseProject, id: 'p3', pinned: true };
  const p4 = { ...baseProject, id: 'p4', pinned: true };
  const p5 = { ...baseProject, id: 'p5', pinned: false };
  const projects = [p1, p2, p3, p4, p5];

  // 4 pinned -> 4 selected, is2x2: true
  const fourPinned = selectHomepageProjects(projects);
  assert.equal(fourPinned.projects.length, 4);
  assert.equal(fourPinned.is2x2, true);

  // 2 pinned -> 2 selected, is2x2: false
  const twoPinned = selectHomepageProjects([p1, p2, p5]);
  assert.equal(twoPinned.projects.length, 2);
  assert.equal(twoPinned.is2x2, false);
});

test('validateProjectCatalog catches pin overflow, duplicate orders, and bad IDs', () => {
  const invalidCatalog: Project[] = [
    { ...baseProject, id: 'INVALID_ID' },
    { ...baseProject, id: 'p1', order: 1, pinned: true },
    { ...baseProject, id: 'p2', order: 1, pinned: true },
    { ...baseProject, id: 'p3', order: 3, pinned: true },
    { ...baseProject, id: 'p4', order: 4, pinned: true },
    { ...baseProject, id: 'p5', order: 5, pinned: true },
  ];
  const errors = validateProjectCatalog(invalidCatalog);
  assert.ok(errors.some((e) => e.includes('ID must be lowercase kebab-case')));
  assert.ok(errors.some((e) => e.includes('display order must be a unique integer')));
  assert.ok(errors.some((e) => e.includes('no more than 4 Published projects may be pinned')));
});

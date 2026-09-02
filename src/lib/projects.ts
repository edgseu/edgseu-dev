import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Project } from '../data/projects';
import { projects } from '../data/projects';

export interface RepositoryMetadata {
  full_name?: string;
  html_url?: string;
  visibility?: string;
  private?: boolean;
  archived?: boolean;
  language?: string | null;
  languages?: string[];
  pushed_at?: string | null;
}

export interface RepositoryResult {
  status: number;
  body?: RepositoryMetadata;
}

export interface EnrichedProject extends Project {
  enrichment?: {
    language?: string;
    languages?: string[];
    pushedAt?: string;
  };
}

export interface RepositoryMetadataProvider {
  getMetadata(projectId: string): Promise<RepositoryResult | undefined>;
}

export class LiveGitHubProvider implements RepositoryMetadataProvider {
  constructor(private readonly owner = 'h1zardian', private readonly timeoutMs = 5_000) {}

  async getMetadata(projectId: string): Promise<RepositoryResult | undefined> {
    const repositoryUrl = `https://api.github.com/repos/${this.owner}/${projectId}`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'edgseu-static-build',
    };
    const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;

    const [repositoryRequest, languagesRequest] = await Promise.allSettled([
      fetch(repositoryUrl, {
        headers,
        signal: AbortSignal.timeout(this.timeoutMs),
      }),
      fetch(`${repositoryUrl}/languages`, {
        headers,
        signal: AbortSignal.timeout(this.timeoutMs),
      }),
    ]);
    if (repositoryRequest.status === 'rejected') return undefined;

    try {
      const response = repositoryRequest.value;
      const body = (await response.json()) as RepositoryMetadata;

      if (
        response.status === 200 &&
        languagesRequest.status === 'fulfilled' &&
        languagesRequest.value.ok
      ) {
        try {
          const languageBytes = (await languagesRequest.value.json()) as Record<string, unknown>;
          body.languages = Object.entries(languageBytes)
            .filter((entry): entry is [string, number] => {
              const bytes = entry[1];
              return typeof bytes === 'number' && Number.isFinite(bytes) && bytes > 0;
            })
            .toSorted((left, right) => right[1] - left[1])
            .slice(0, 3)
            .map(([language]) => language);
        } catch {
          // Keep repository identity and update metadata when language totals are malformed.
        }
      }

      return { status: response.status, body };
    } catch {
      return undefined;
    }
  }
}

export class FixtureMetadataProvider implements RepositoryMetadataProvider {
  private readonly fixtures: Record<string, RepositoryResult>;

  constructor(source: string | Record<string, RepositoryResult>) {
    if (typeof source === 'string') {
      this.fixtures = JSON.parse(readFileSync(resolve(source), 'utf8')) as Record<string, RepositoryResult>;
    } else {
      this.fixtures = source;
    }
  }

  async getMetadata(projectId: string): Promise<RepositoryResult | undefined> {
    return this.fixtures[projectId];
  }
}

export class OfflineMetadataProvider implements RepositoryMetadataProvider {
  async getMetadata(): Promise<RepositoryResult | undefined> {
    return undefined;
  }
}

export function createDefaultProvider(): RepositoryMetadataProvider {
  if (process.env.GITHUB_ENRICHMENT === 'off') {
    return new OfflineMetadataProvider();
  }
  const fixturePath = process.env.GITHUB_ENRICHMENT_FILE;
  if (fixturePath) {
    return new FixtureMetadataProvider(fixturePath);
  }
  return new LiveGitHubProvider();
}

export function validateProjectCatalog(catalog: readonly Project[] = projects): string[] {
  const errors: string[] = [];
  const fail = (location: string, message: string) => {
    errors.push(`${location}: ${message}`);
  };

  const ids = new Set<string>();
  const orders = new Set<number>();

  for (const project of catalog) {
    const location = `project ${project.id}`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(project.id)) {
      fail(location, 'ID must be lowercase kebab-case');
    }
    if (ids.has(project.id)) {
      fail(location, 'ID must be unique');
    }
    ids.add(project.id);
    if (!project.title.trim()) {
      fail(location, 'title is required');
    }
    if (!project.summary.trim() || project.summary.length > 240 || /[\n\r<>]/u.test(project.summary)) {
      fail(location, 'summary must be plain text between 1 and 240 characters');
    }
    if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/u.test(project.url)) {
      fail(location, 'Published destination must be a canonical GitHub repository URL');
    }
    if (!Number.isInteger(project.order) || orders.has(project.order)) {
      fail(location, 'display order must be a unique integer');
    }
    orders.add(project.order);
    if (project.tags.length < 1 || project.tags.length > 6) {
      fail(location, 'requires one to six tags');
    }
    const tags = project.tags.map((tag) => tag.toLocaleLowerCase());
    if (new Set(tags).size !== tags.length) {
      fail(location, 'tags must be unique ignoring case');
    }
    if (project.pinned !== undefined && typeof project.pinned !== 'boolean') {
      fail(location, 'pinned must be a boolean');
    }
  }

  const pinnedProjects = catalog.filter((project) => project.state === 'Published' && project.pinned);
  if (pinnedProjects.length > 4) {
    fail('projects', 'no more than 4 Published projects may be pinned');
  }

  const publishedOrder = catalog
    .filter((project) => project.state === 'Published')
    .toSorted((a, b) => a.order - b.order);

  if (publishedOrder[0]?.id !== 'devsecops-pipeline-project' || publishedOrder[1]?.id !== 'cowrie-sentinel-lab') {
    fail('projects', 'approved Projects must remain in the fixed display order');
  }

  return errors;
}

export function sortPublishedProjects(catalog: readonly Project[]): Project[] {
  return catalog
    .filter((project) => project.state === 'Published')
    .toSorted((left, right) => {
      const leftPinned = Boolean(left.pinned);
      const rightPinned = Boolean(right.pinned);
      if (leftPinned !== rightPinned) return leftPinned ? -1 : 1;
      return left.order - right.order;
    });
}

export async function enrichProject(
  project: Project,
  provider: RepositoryMetadataProvider = createDefaultProvider(),
): Promise<EnrichedProject> {
  const result = await provider.getMetadata(project.id);
  if (!result || result.status === 403 || result.status === 429 || result.status >= 500) {
    return project;
  }
  if (result.status === 404) {
    throw new Error(`Published Project repository is private, deleted, or inaccessible: ${project.url}`);
  }
  if (result.status !== 200 || !result.body) {
    return project;
  }

  const expectedName = `h1zardian/${project.id}`;
  if (result.body.private || result.body.visibility !== 'public') {
    throw new Error(`Published Project repository is not public: ${project.url}`);
  }
  if (result.body.full_name !== expectedName || result.body.html_url !== project.url) {
    throw new Error(`Published Project repository was renamed or moved: ${project.url}`);
  }

  const rawLanguages =
    Array.isArray(result.body.languages) && result.body.languages.length > 0
      ? result.body.languages.map((language) => language.trim()).filter(Boolean)
      : result.body.language?.trim()
        ? [result.body.language.trim()]
        : [];
  const languages =
    rawLanguages.length > 0 ? [...new Set(rawLanguages)].slice(0, 3) : undefined;
  const language = languages?.[0];
  const pushedAt = result.body.pushed_at?.slice(0, 10);

  return {
    ...project,
    lifecycle: result.body.archived ? 'Archived' : project.lifecycle,
    ...(languages || pushedAt
      ? {
          enrichment: {
            ...(language ? { language } : {}),
            ...(languages ? { languages } : {}),
            ...(pushedAt ? { pushedAt } : {}),
          },
        }
      : {}),
  } satisfies EnrichedProject;
}

export async function enrichProjects(
  catalog: readonly Project[],
  provider: RepositoryMetadataProvider = createDefaultProvider(),
): Promise<EnrichedProject[]> {
  return Promise.all(catalog.map((project) => enrichProject(project, provider)));
}

export interface ProjectCatalog {
  publishedProjects: EnrichedProject[];
  homepageProjects: EnrichedProject[];
  isHomepageProjectGrid2x2: boolean;
}

export interface LoadProjectCatalogOptions {
  catalog?: readonly Project[];
  provider?: RepositoryMetadataProvider;
}

export function selectHomepageProjects(published: readonly EnrichedProject[]): {
  projects: EnrichedProject[];
  is2x2: boolean;
} {
  const pinned = published.filter((project) => project.pinned);
  const selected =
    pinned.length > 2
      ? published.slice(0, Math.min(4, Math.max(pinned.length, 2)))
      : published.slice(0, 2);
  return {
    projects: selected,
    is2x2: selected.length > 2,
  };
}

async function buildProjectCatalog(
  catalog: readonly Project[],
  provider: RepositoryMetadataProvider,
): Promise<ProjectCatalog> {
  const errors = validateProjectCatalog(catalog);
  if (errors.length > 0) {
    throw new Error(`Invalid Project catalog:\n${errors.join('\n')}`);
  }

  const publishedProjects = await enrichProjects(sortPublishedProjects(catalog), provider);
  const {
    projects: homepageProjects,
    is2x2: isHomepageProjectGrid2x2,
  } = selectHomepageProjects(publishedProjects);
  return { publishedProjects, homepageProjects, isHomepageProjectGrid2x2 };
}

let defaultProjectCatalog: Promise<ProjectCatalog> | undefined;

export function loadProjectCatalog(
  options: LoadProjectCatalogOptions = {},
): Promise<ProjectCatalog> {
  if (options.catalog || options.provider) {
    return buildProjectCatalog(
      options.catalog ?? projects,
      options.provider ?? createDefaultProvider(),
    );
  }

  defaultProjectCatalog ??= buildProjectCatalog(projects, createDefaultProvider());
  return defaultProjectCatalog;
}

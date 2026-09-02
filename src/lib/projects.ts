import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';
import { profile } from '../data/profile';

export type ProjectLifecycle = 'Active' | 'Maintained' | 'Complete' | 'Archived';
export type PublicationState = 'Draft' | 'Published';

export interface Project {
  id: string;
  title: string;
  summary: string;
  url: string;
  state: PublicationState;
  lifecycle: ProjectLifecycle;
  tags: readonly string[];
  order: number;
  pinned?: boolean | undefined;
}
export const projectSchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, 'ID must be lowercase kebab-case'),
  title: z.string().trim().min(1, 'title is required'),
  summary: z.string().trim().min(1, 'summary is required').max(240, 'summary must be between 1 and 240 characters').refine(
    (val) => !/[\n\r<>]/.test(val),
    'summary must not contain line breaks or angle brackets',
  ),
  url: z.string().trim().regex(/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/u, 'Published destination must be a canonical GitHub repository URL'),
  state: z.enum(['Draft', 'Published']),
  lifecycle: z.enum(['Active', 'Maintained', 'Complete', 'Archived']),
  tags: z.array(z.string().trim().min(1)).min(1, 'requires one to six tags').max(6, 'requires one to six tags').superRefine((tags, ctx) => {
    const normalized = tags.map((t) => t.toLocaleLowerCase());
    if (new Set(normalized).size !== normalized.length) {
      ctx.addIssue({ code: 'custom', message: 'tags must be unique ignoring case' });
    }
  }),
  order: z.number().int('display order must be a unique integer'),
  pinned: z.boolean().optional(),
});

const projectsFileSchema = z.object({
  projects: z.array(projectSchema),
});

export interface ProjectsValidation {
  projects?: Project[] | undefined;
  errors: string[];
}

const projectsCache = new Map<string, { mtime: number; result: ProjectsValidation }>();

export function validateProjectsFile(file = process.env.PROJECTS_FILE ?? 'src/content/projects.yaml'): ProjectsValidation {
  const projectsFile = resolve(file);
  let mtime = 0;
  try {
    mtime = statSync(projectsFile).mtimeMs;
    const cached = projectsCache.get(projectsFile);
    if (cached && cached.mtime === mtime) {
      return cached.result;
    }
  } catch {
    // let readFileSync report error
  }

  let source: string;
  try {
    source = readFileSync(projectsFile, 'utf8');
  } catch (error) {
    return {
      errors: [`could not read Projects source: ${error instanceof Error ? error.message : 'unknown error'}`],
    };
  }

  let data: unknown;
  try {
    const wrapped = source.startsWith('---') ? source : `---\n${source}\n---`;
    data = matter(wrapped).data;
  } catch (error) {
    return {
      errors: [`invalid Projects YAML: ${error instanceof Error ? error.message : 'parse error'}`],
    };
  }

  const result = Array.isArray(data)
    ? z.array(projectSchema).safeParse(data)
    : projectsFileSchema.safeParse(data);

  if (!result.success) {
    return {
      errors: result.error.issues.map((issue) => `${issue.path.join('.') || 'projects'}: ${issue.message}`),
    };
  }

  const catalog = Array.isArray(result.data) ? result.data : result.data.projects;
  const errors = validateProjectCatalog(catalog);
  const validation: ProjectsValidation = {
    projects: errors.length === 0 ? catalog : undefined,
    errors,
  };
  if (mtime > 0) {
    projectsCache.set(projectsFile, { mtime, result: validation });
  }
  return validation;
}

export function loadProjects(file?: string): Project[] {
  const result = validateProjectsFile(file);
  if (!result.projects || result.errors.length > 0) {
    throw new Error(`Invalid Projects content:\n${result.errors.map((e) => `- ${e}`).join('\n')}`);
  }
  return result.projects;
}
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

export interface ProjectEnricher {
  enrich(project: Project): Promise<EnrichedProject>;
}

function parseProjectRepository(project: Project): { owner: string; repo: string } {
  const match = project.url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)/);
  const defaultOwner = profile.github.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '') || profile.username;
  const owner = match?.[1] ?? defaultOwner;
  const repo = match?.[2] ?? project.id;
  return { owner, repo };
}

function applyRepositoryResult(
  project: Project,
  owner: string,
  repo: string,
  result: RepositoryResult | undefined,
): EnrichedProject {
  if (!result || result.status === 403 || result.status === 429 || result.status >= 500) {
    return project;
  }
  if (result.status === 404) {
    throw new Error(`Published Project repository is private, deleted, or inaccessible: ${project.url}`);
  }
  if (result.status !== 200 || !result.body) {
    return project;
  }

  const expectedName = `${owner}/${repo}`;
  if (result.body.private || result.body.visibility !== 'public') {
    throw new Error(`Published Project repository is not public: ${project.url}`);
  }
  if (
    !result.body.full_name ||
    !result.body.html_url ||
    result.body.full_name.toLowerCase() !== expectedName.toLowerCase() ||
    result.body.html_url.toLowerCase() !== project.url.toLowerCase()
  ) {
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

export class LiveGitHubAdapter implements ProjectEnricher {
  constructor(
    private readonly defaultOwner = profile.github.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '') || profile.username,
    private readonly timeoutMs = 5_000,
  ) {}

  async enrich(project: Project): Promise<EnrichedProject> {
    const { owner = this.defaultOwner, repo } = parseProjectRepository(project);
    const repositoryUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'edgseu-static-build',
    };
    const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
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

      if (repositoryRequest.status === 'rejected') {
        return project;
      }

      const response = repositoryRequest.value;
      if (response.status === 403 || response.status === 429 || response.status >= 500) {
        return project;
      }
      if (response.status === 404) {
        throw new Error(`Published Project repository is private, deleted, or inaccessible: ${project.url}`);
      }
      if (response.status !== 200) {
        return project;
      }

      const body = (await response.json()) as RepositoryMetadata;

      if (
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

      return applyRepositoryResult(project, owner, repo, { status: response.status, body });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Published Project repository')) {
        throw error;
      }
      return project;
    }
  }
}

export class FixtureGitHubAdapter implements ProjectEnricher {
  private readonly fixtures: Record<string, RepositoryResult>;

  constructor(source: string | Record<string, RepositoryResult>) {
    if (typeof source === 'string') {
      this.fixtures = JSON.parse(readFileSync(resolve(source), 'utf8')) as Record<string, RepositoryResult>;
    } else {
      this.fixtures = source;
    }
  }

  async enrich(project: Project): Promise<EnrichedProject> {
    const { owner, repo } = parseProjectRepository(project);
    const result = this.fixtures[repo] ?? this.fixtures[project.id];
    return applyRepositoryResult(project, owner, repo, result);
  }
}

export class OfflineGitHubAdapter implements ProjectEnricher {
  async enrich(project: Project): Promise<EnrichedProject> {
    return project;
  }
}

export function createDefaultEnricher(): ProjectEnricher {
  if (process.env.GITHUB_ENRICHMENT === 'off') {
    return new OfflineGitHubAdapter();
  }
  const fixturePath = process.env.GITHUB_ENRICHMENT_FILE;
  if (fixturePath) {
    return new FixtureGitHubAdapter(fixturePath);
  }
  return new LiveGitHubAdapter();
}

export type RepositoryMetadataProvider = ProjectEnricher;
export const LiveGitHubProvider = LiveGitHubAdapter;
export type LiveGitHubProvider = LiveGitHubAdapter;
export const FixtureMetadataProvider = FixtureGitHubAdapter;
export type FixtureMetadataProvider = FixtureGitHubAdapter;
export const OfflineMetadataProvider = OfflineGitHubAdapter;
export type OfflineMetadataProvider = OfflineGitHubAdapter;
export const createDefaultProvider = createDefaultEnricher;

export function validateProjectCatalog(catalog: readonly Project[] = loadProjects()): string[] {
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
  enricher: ProjectEnricher = createDefaultEnricher(),
): Promise<EnrichedProject> {
  return enricher.enrich(project);
}

export async function enrichProjects(
  catalog: readonly Project[],
  enricher: ProjectEnricher = createDefaultEnricher(),
): Promise<EnrichedProject[]> {
  return Promise.all(catalog.map((project) => enricher.enrich(project)));
}

export interface ProjectCatalog {
  publishedProjects: EnrichedProject[];
  homepageProjects: EnrichedProject[];
  isHomepageProjectGrid2x2: boolean;
}

export interface LoadProjectCatalogOptions {
  catalog?: readonly Project[];
  enricher?: ProjectEnricher;
  provider?: ProjectEnricher;
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
  enricher: ProjectEnricher = createDefaultEnricher(),
): Promise<ProjectCatalog> {
  const errors = validateProjectCatalog(catalog);
  if (errors.length > 0) {
    throw new Error(`Invalid Project catalog:\n${errors.join('\n')}`);
  }

  const publishedProjects = await enrichProjects(sortPublishedProjects(catalog), enricher);
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
  const enricher = options.enricher ?? options.provider;
  if (options.catalog || enricher) {
    return buildProjectCatalog(
      options.catalog ?? loadProjects(),
      enricher ?? createDefaultEnricher(),
    );
  }

  defaultProjectCatalog ??= buildProjectCatalog(loadProjects(), createDefaultEnricher());
  return defaultProjectCatalog;
}

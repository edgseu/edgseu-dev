import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Project } from '../data/projects';
import { projects } from '../data/projects';

interface RepositoryMetadata {
  full_name?: string;
  html_url?: string;
  visibility?: string;
  private?: boolean;
  archived?: boolean;
  language?: string | null;
  pushed_at?: string | null;
}

interface RepositoryResult {
  status: number;
  body?: RepositoryMetadata;
}

export interface EnrichedProject extends Project {
  enrichment?: {
    language?: string;
    pushedAt?: string;
  };
}

const fixturePath = process.env.GITHUB_ENRICHMENT_FILE;
const fixture = fixturePath
  ? JSON.parse(readFileSync(resolve(fixturePath), 'utf8')) as Record<string, RepositoryResult>
  : undefined;

async function repositoryResult(project: Project): Promise<RepositoryResult | undefined> {
  if (process.env.GITHUB_ENRICHMENT === 'off') return undefined;
  if (fixture) return fixture[project.id];
  try {
    const response = await fetch(`https://api.github.com/repos/h1zardian/${project.id}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'edgseu-static-build' },
      signal: AbortSignal.timeout(5_000),
    });
    const body = await response.json() as RepositoryMetadata;
    return { status: response.status, body };
  } catch {
    return undefined;
  }
}

const curatedPublishedProjects = projects
  .filter((project) => project.state === 'Published')
  .toSorted((left, right) => left.order - right.order);

export const publishedProjects: EnrichedProject[] = await Promise.all(
  curatedPublishedProjects.map(async (project) => {
    const result = await repositoryResult(project);
    if (!result || result.status === 403 || result.status === 429 || result.status >= 500) return project;
    if (result.status === 404) throw new Error(`Published Project repository is private, deleted, or inaccessible: ${project.url}`);
    if (result.status !== 200 || !result.body) return project;
    const expectedName = `h1zardian/${project.id}`;
    if (result.body.private || result.body.visibility !== 'public') {
      throw new Error(`Published Project repository is not public: ${project.url}`);
    }
    if (result.body.full_name !== expectedName || result.body.html_url !== project.url) {
      throw new Error(`Published Project repository was renamed or moved: ${project.url}`);
    }
    const language = result.body.language?.trim();
    const pushedAt = result.body.pushed_at?.slice(0, 10);
    return {
      ...project,
      lifecycle: result.body.archived ? 'Archived' : project.lifecycle,
      ...((language || pushedAt) ? {
        enrichment: {
          ...(language ? { language } : {}),
          ...(pushedAt ? { pushedAt } : {}),
        },
      } : {}),
    } satisfies EnrichedProject;
  }),
);

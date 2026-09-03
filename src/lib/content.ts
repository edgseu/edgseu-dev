import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { validateBioFile, validateProfileFile } from './profile';
import { validateProjectsFile } from './projects';
import {
  parseAndValidateArticle,
  validateArticleCollection,
  type ParsedArticle,
} from './articles';

export interface CatalogValidationResult {
  valid: boolean;
  errors: string[];
  counts: {
    profile: number;
    projects: number;
    articles: number;
  };
}

export interface CatalogOptions {
  articleRoot?: string;
  metadataFile?: string;
  bioFile?: string;
  projectsFile?: string;
}

export function validateFullCatalog(options: CatalogOptions = {}): CatalogValidationResult {
  const errors: string[] = [];
  const articleRoot = resolve(options.articleRoot ?? process.env.ARTICLE_ROOT ?? 'src/content/articles');
  const metadataFile = resolve(options.metadataFile ?? process.env.METADATA_FILE ?? process.env.PROFILE_FILE ?? 'src/content/metadata.yaml');
  const bioFile = resolve(options.bioFile ?? process.env.BIO_FILE ?? 'src/content/bio.md');
  const projectsFile = resolve(options.projectsFile ?? process.env.PROJECTS_FILE ?? 'src/content/projects.yaml');

  // 1. Validate Profile Metadata
  const profileResult = validateProfileFile(metadataFile);
  for (const error of profileResult.errors) errors.push(`${metadataFile}: ${error}`);

  // 2. Validate Bio Markdown
  const bioResult = validateBioFile(bioFile);
  for (const error of bioResult.errors) errors.push(`${bioFile}: ${error}`);

  // 3. Validate Projects
  const projectResult = validateProjectsFile(projectsFile);
  for (const error of projectResult.errors) errors.push(`${projectsFile}: ${error}`);

  // 4. Validate Articles
  const validArticles: ParsedArticle[] = [];
  if (!existsSync(articleRoot)) {
    errors.push(`${articleRoot}: Article root does not exist`);
  } else {
    const entries = readdirSync(articleRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.mdx')) {
        errors.push(`${join(articleRoot, entry.name)}: MDX is not allowlisted`);
      }
    }

    for (const entry of entries.filter((e) => e.isDirectory())) {
      const dir = join(articleRoot, entry.name);
      const file = join(dir, 'index.md');
      if (!existsSync(file)) {
        errors.push(`${dir}: Article folder must contain index.md`);
        continue;
      }
      const metadataYaml = join(dir, 'metadata.yaml');
      const metadataYml = join(dir, 'metadata.yml');
      if (!existsSync(metadataYaml) && !existsSync(metadataYml)) {
        errors.push(`${dir}: Article folder must contain metadata.yaml`);
      }
      const source = readFileSync(file, 'utf8');
      const result = parseAndValidateArticle(source, {
        slug: basename(dir),
        file,
        baseDirectory: dir,
      });
      for (const error of result.errors) errors.push(error);
      if (result.article) validArticles.push(result.article);
    }

    const collectionErrors = validateArticleCollection(validArticles);
    for (const error of collectionErrors) errors.push(error);
  }

  return {
    valid: errors.length === 0,
    errors,
    counts: {
      profile: profileResult.profile ? 1 : 0,
      projects: projectResult.projects ? projectResult.projects.length : 0,
      articles: validArticles.length,
    },
  };
}



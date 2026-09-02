import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { projects } from '../src/data/projects';
import {
  parseAndValidateArticle,
  validateArticleCollection,
  type ParsedArticle,
} from '../src/lib/articles';
import { validateProfileFile } from '../src/lib/profile';
import { validateProjectsFile } from '../src/lib/projects';

const errors: string[] = [];
const articleRoot = resolve(process.env.ARTICLE_ROOT ?? 'src/content/articles');
const profileFile = resolve(process.env.PROFILE_FILE ?? 'src/content/profile.md');
const projectsFile = resolve(process.env.PROJECTS_FILE ?? 'src/content/projects.md');
function fail(location: string, message: string): void {
  errors.push(`${location}: ${message}`);
}

// 1. Validate Profile
const profileResult = validateProfileFile(profileFile);
for (const error of profileResult.errors) fail(profileFile, error);

// 2. Validate Projects
const projectResult = validateProjectsFile(projectsFile);
for (const error of projectResult.errors) fail(projectsFile, error);

// 3. Validate Articles
if (!existsSync(articleRoot)) {
  fail(articleRoot, 'Article root does not exist');
}

const entries = existsSync(articleRoot)
  ? readdirSync(articleRoot, { withFileTypes: true })
  : [];

for (const entry of entries) {
  if (entry.isFile() && entry.name.endsWith('.mdx')) {
    fail(join(articleRoot, entry.name), 'MDX is not allowlisted');
  }
}

const validArticles: ParsedArticle[] = [];

for (const entry of entries.filter((e) => e.isDirectory())) {
  const dir = join(articleRoot, entry.name);
  const file = join(dir, 'index.md');
  if (!existsSync(file)) {
    fail(dir, 'Article folder must contain index.md');
    continue;
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

// 4. Output results
if (errors.length > 0) {
  console.error(`Content validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Content validation passed: 1 Profile, ${projects.length} Projects, ${validArticles.length} Articles.`,
  );
}

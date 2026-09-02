import { validateFullCatalog } from '../src/lib/content';

const result = validateFullCatalog();

if (!result.valid) {
  console.error(`Content validation failed with ${result.errors.length} error${result.errors.length === 1 ? '' : 's'}:`);
  for (const error of result.errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Content validation passed: ${result.counts.profile} Profile, ${result.counts.projects} Projects, ${result.counts.articles} Articles.`,
  );
}

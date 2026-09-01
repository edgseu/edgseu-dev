import { projects } from '../src/data/projects';
import { profile } from '../src/data/profile';

const urls = [
  profile.github,
  profile.linkedin,
  ...(profile.resumeUrl ? [profile.resumeUrl] : []),
  ...projects.filter((project) => project.state === 'Published').map((project) => project.url),
];
const failures: string[] = [];
for (const url of urls) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': 'edgseu-external-link-review' },
    });
    console.log(`${response.status} ${url}`);
    if (!response.ok) failures.push(`${response.status} ${url}`);
  } catch (error) {
    failures.push(`${error instanceof Error ? error.message : 'request failed'} ${url}`);
  }
}
if (failures.length > 0) {
  console.error('External-link review required:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}

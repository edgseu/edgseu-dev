import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { load } from 'cheerio';
import test from 'node:test';

const output = 'dist-profile';

test('Profile rail publishes a configured résumé destination', () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'edgseu-profile-'));
  const profileFile = join(fixtureRoot, 'metadata.yaml');
  writeFileSync(profileFile, `name: Profile Fixture
username: fixture
role: Cloud Engineer
location: India
email: fixture@example.com
github: https://github.com/example
linkedin: https://www.linkedin.com/in/example
avatar: /images/avatar.png
promptHost: cloud
host: cloud-node
resumeUrl: https://example.com/resume.pdf
focusAreas: [Cloud]
shortSkills: [AWS]
skills: [AWS EKS]
`);
  rmSync(output, { recursive: true, force: true });
  try {
    const result = spawnSync('pnpm', ['astro', 'build', '--outDir', output], {
      cwd: process.cwd(),
      env: { ...process.env, METADATA_FILE: profileFile },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);

    const homepage = load(readFileSync(join(output, 'index.html'), 'utf8'));
    const resume = homepage('.profile-links a').filter((_, element) => homepage(element).text().trim() === 'Résumé');
    assert.equal(resume.length, 1);
    assert.equal(resume.attr('href'), '/resume/');
    assert.equal(resume.find('svg').length, 1, 'Résumé link should include the document icon');
  } finally {
    rmSync(output, { recursive: true, force: true });
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

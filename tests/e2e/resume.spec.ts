import { test, expect } from '@playwright/test';
import { profile } from '../../src/data/profile';

test('/resume renders the full resume with header download action', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/resume/');

  await expect(page.locator('.resume-header h1')).toHaveText(profile.name);
  await expect(page.locator('.resume-prose h2')).toHaveText([
    'PROFESSIONAL SUMMARY',
    'TECHNICAL SKILLS',
    'PROFESSIONAL EXPERIENCE',
    'KEY PROJECTS',
    'EDUCATION',
    'CERTIFICATIONS',
  ]);

  // download button at the top right of the page content, with icon and label
  const download = page.locator('.resume-header .resume-download-btn');
  await expect(download).toBeVisible();
  await expect(download).toHaveAttribute('href', profile.resumeUrl!);
  await expect(download).toHaveAttribute('target', '_blank');
  await expect(download).toContainText('Download');
  await expect(download.locator('svg')).toBeVisible();
});

test('resume page is not a top navigation tab', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/articles/');
  await expect(page.locator('.desktop-nav a')).toHaveCount(4);
  const labels = await page.locator('.desktop-nav a').allTextContents();
  expect(labels.join(',')).not.toContain('Resume');
});

test('profile rail resume button links to the internal page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const railLink = page.locator('.profile-links a', { hasText: 'Resume' });
  await expect(railLink).toBeVisible();
  await expect(railLink).toHaveAttribute('href', '/resume/');
  await railLink.click();
  await expect(page).toHaveURL(/\/resume\/$/);
  await expect(page.locator('.resume-header h1')).toHaveText(profile.name);
});

test('resume page has no accessibility violations in dark and light themes', async ({ page }) => {
  const AxeBuilder = (await import('@axe-core/playwright')).default;
  for (const theme of ['dark', 'light'] as const) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/resume/');
    if (theme === 'light') await page.locator('.theme-toggle').first().click();
    await page.waitForTimeout(300);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, `${theme} theme`).toEqual([]);
  }
});

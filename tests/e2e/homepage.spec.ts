import { expect, test } from '@playwright/test';

const firstProject = 'https://github.com/h1zardian/devsecops-pipeline-project';
const secondProject = 'https://github.com/h1zardian/cowrie-sentinel-lab';

test('Homepage keeps identity and destinations useful without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Aman Bhushan Singh' })).toBeVisible();
  await expect(page.getByText('Cloud Security & Operations Engineer', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /GitHub/ }).first()).toHaveAttribute('href', 'https://github.com/h1zardian');
  await expect(page.getByRole('link', { name: /LinkedIn/ }).first()).toHaveAttribute('href', 'https://www.linkedin.com/in/amanbs');
  await expect(page.locator('#terminal-output p').first()).toContainText('whoami');
  await context.close();
});

test('terminal opts in to focus and supports only curated commands', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#terminal-input')).not.toBeFocused();
  await page.locator('#terminal-input').fill('skills');
  await page.locator('#terminal-input').press('Enter');
  await expect(page.locator('#terminal-output p').filter({ hasText: 'Cloud infrastructure' })).toBeVisible();
  await page.locator('#terminal-input').fill('sudo');
  await page.locator('#terminal-input').press('Enter');
  await expect(page.getByText('Unknown command: sudo. Type help.')).toBeVisible();
  await page.locator('#terminal-input').fill('theme');
  await page.locator('#terminal-input').press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('Projects preserve curated order and link directly to GitHub', async ({ page }) => {
  await page.goto('/projects/');
  const projectLinks = page.locator('.project-card a[href^="https://github.com/h1zardian/"]');
  await expect(projectLinks).toHaveCount(2);
  await expect(projectLinks.nth(0)).toHaveAttribute('href', firstProject);
  await expect(projectLinks.nth(1)).toHaveAttribute('href', secondProject);
  await expect(page.locator('.project-card a[href^="/projects/"]')).toHaveCount(0);
});

test('compact Menu closes with Escape and restores trigger focus', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Menu' });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
});

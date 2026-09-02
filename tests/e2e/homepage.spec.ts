import { expect, test } from '@playwright/test';
import { profile } from '../../src/data/profile';

const firstProject = 'https://github.com/h1zardian/devsecops-pipeline-project';
const secondProject = 'https://github.com/h1zardian/cowrie-sentinel-lab';
test('Homepage keeps identity and destinations useful without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Aman Bhushan Singh' })).toBeVisible();
  await expect(page.locator('.profile-card .role')).toHaveText('Cloud Security & Operations Engineer');
  await expect(page.getByRole('link', { name: /GitHub/ }).first()).toHaveAttribute('href', 'https://github.com/h1zardian');
  await expect(page.getByRole('link', { name: /LinkedIn/ }).first()).toHaveAttribute('href', 'https://linkedin.com/in/amanbs');
  await expect(page.locator('#terminal-output p').first()).toContainText('whoami');
  if (profile.resumeUrl) {
    await expect(page.getByRole('link', { name: 'Résumé' })).toHaveAttribute(
      'href',
      profile.resumeUrl,
    );
  }
  await expect(page.locator('#terminal-output')).toContainText('edgseu@cloud:~$');
  await expect(page.locator('#terminal-output')).toContainText('cloud-node');
  await expect(page.locator('#terminal-output')).toContainText('skills');
  await expect(page.locator('#terminal-output')).toContainText('AWS · Azure · Kubernetes');
  await context.close();
});

test('terminal opts in to focus and supports only curated commands', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#terminal-input')).not.toBeFocused();
  await page.locator('#terminal-input').fill('help');
  await page.locator('#terminal-input').press('Enter');
  await expect(page.getByText('Available commands: help, whoami, skills, contact, theme, clear')).toBeVisible();
  await page.locator('#terminal-input').fill('skills');
  await page.locator('#terminal-input').press('Enter');
  const skillsOutput = page.locator('#terminal-output pre').last();
  await expect(skillsOutput).toContainText('AWS EKS');
  await expect(skillsOutput).toContainText('Azure AKS');
  await expect(skillsOutput).not.toContainText('󰒍');
  await expect(skillsOutput).not.toContainText(' · ');
  await page.locator('#terminal-input').fill('whoami');
  await page.locator('#terminal-input').press('Enter');
  await expect(page.locator('#terminal-output pre').last()).toContainText('skills');
  await expect(page.locator('#terminal-output pre').last()).toContainText('AWS · Azure · Kubernetes');
  await page.locator('#terminal-input').fill('contact');
  await page.locator('#terminal-input').press('Enter');
  const contactOutput = page.locator('#terminal-output pre').last();
  await expect(contactOutput).toContainText(`Email:    ${profile.email}`);
  await expect(contactOutput).toContainText(`GitHub:   ${profile.github.replace('https://', '')}`);
  await expect(contactOutput).toContainText(`LinkedIn: ${profile.linkedin.replace('https://', '')}`);
  await expect(contactOutput.locator('svg')).toHaveCount(3);
  await page.locator('#terminal-input').fill('projects');
  await page.locator('#terminal-input').press('Enter');
  await expect(page.getByText('Unknown command: projects. Type help.')).toBeVisible();
  await page.locator('#terminal-input').fill('articles');
  await page.locator('#terminal-input').press('Enter');
  await expect(page.getByText('Unknown command: articles. Type help.')).toBeVisible();
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
  await expect(projectLinks).toHaveCount(8);
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

import { expect, test } from '@playwright/test';

const routes = ['/', '/projects/', '/articles/'];

for (const route of routes) {
  test(`${route} exposes the shared static shell`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('a').first()).toHaveText('Skip to content');
    await expect(page.getByRole('link', { name: 'edgseu' })).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://edgseu.dev${route}`,
    );
  });
}

test('first visit is dark and an explicit theme choice persists', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Use light theme' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Use dark theme' })).toBeVisible();
});

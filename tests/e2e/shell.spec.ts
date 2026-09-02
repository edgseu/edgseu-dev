import { expect, test } from '@playwright/test';

const routes = ['/', '/projects/', '/articles/'];

for (const route of routes) {
  test(`${route} exposes the shared static shell`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('a').first()).toHaveText('Skip to content');
    await expect(page.getByRole('link', { name: 'edgseu', exact: true })).toBeVisible();
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

test('mobile header theme toggle and menu button are inline with matching height', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto('/');
  const themeToggle = page.locator('.theme-toggle');
  const menuToggle = page.locator('.menu-toggle');

  await expect(themeToggle).toBeVisible();
  await expect(menuToggle).toBeVisible();

  const themeBox = await themeToggle.boundingBox();
  const menuBox = await menuToggle.boundingBox();

  expect(themeBox).not.toBeNull();
  expect(menuBox).not.toBeNull();

  expect(Math.abs(themeBox!.height - menuBox!.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(themeBox!.y - menuBox!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(themeBox!.width - themeBox!.height)).toBeLessThanOrEqual(1);
  expect(themeBox!.x).toBeLessThan(menuBox!.x);
});

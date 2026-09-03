import { expect, test } from '@playwright/test';
import { site } from '../../src/data/site';

const articlePath = '/articles/kvm-windows-optimization/';
test('Published Article exposes canonical context and portable body', async ({ page }) => {
  await page.goto(articlePath);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Optimizing Windows VM performance on QEMU and KVM');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new URL(articlePath, site.canonicalUrl).href);
  await expect(page.locator('.article-context')).toContainText('Optimizing Windows VM performance on QEMU and KVM');
  await expect(page.locator('.article-header time').first()).toHaveText('Published 2026-09-03');
  await expect(page.locator('pre').first()).toBeVisible();
  expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain('Article');
});

test('ordinary scrolling does not mutate URL while explicit outline activation does', async ({ page }) => {
  await page.goto(articlePath);
  await page.getByRole('heading', { name: 'Storage bus configuration' }).scrollIntoViewIfNeeded();
  await expect(page).toHaveURL(new RegExp(`${articlePath}$`));
  await page.locator('.article-grid .article-outline').getByRole('link', { name: 'Storage bus configuration' }).click();
  await expect(page).toHaveURL(/#storage-bus-configuration$/);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${articlePath}$`));
});

test('code copy gives explicit accessible feedback', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(articlePath);
  const copy = page.locator('.copy-code').first();
  await copy.click();
  await expect(copy).toHaveText('Copied');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('libvirtd.service');
});

test('mobile global and Article disclosures are mutually exclusive', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto(articlePath);
  const menu = page.locator('.menu-toggle');
  const outline = page.locator('.outline-disclosure > button');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await outline.click();
  await expect(outline).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Escape');
  await expect(outline).toHaveAttribute('aria-expanded', 'false');
  await expect(outline).toBeFocused();
});

test('Article baseline and discussion fallback remain useful without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(articlePath);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Prerequisites and host preparation' })).toBeVisible();
  await expect(page.locator('pre').first()).toContainText('libvirtd.service');
  await expect(page.getByText(/Article remains available if GitHub is blocked/)).toBeVisible();
  await context.close();
});

test('old Article path is a static canonical meta-refresh redirect', async ({ request }) => {
  const response = await request.get('/articles/windows-kvm-optimization/');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('http-equiv="refresh"');
  expect(html).toContain(`href="${new URL(articlePath, site.canonicalUrl).href}"`);
  expect(html).toContain(`href="${articlePath}"`);
});

test('desktop Table of Contents sticks to viewport when scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(articlePath);
  const outline = page.locator('.article-grid .article-outline');
  const initialPosition = await outline.evaluate((el) => getComputedStyle(el).position);
  expect(initialPosition).toBe('sticky');

  await page.getByRole('heading', { name: 'Hyper-V enlightenments configuration' }).scrollIntoViewIfNeeded();
  await expect(outline).toBeInViewport();
  const boundingBox = await outline.boundingBox();
  expect(boundingBox).not.toBeNull();
  expect(boundingBox!.y).toBeGreaterThanOrEqual(0);
});

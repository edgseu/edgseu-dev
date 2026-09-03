import { test } from '@playwright/test';
test('review sweep', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '.debug/home-dark.png' });
  await page.locator('.theme-toggle, button[aria-label*="theme" i], button:has-text("Light")').first().click().catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.debug/home-light.png' });
  await page.goto('/articles/how-honeypots-work-dshield-cowrie/');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.debug/article-top.png' });
});

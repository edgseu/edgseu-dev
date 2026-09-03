import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { publishedArticles } from '../../src/lib/articles';

const dynamicRoutes = ['/', '/projects/', '/articles/'];
if (publishedArticles.length > 0 && publishedArticles[0]) {
  dynamicRoutes.push(publishedArticles[0].path);
}

for (const route of dynamicRoutes) {
  for (const theme of ['dark', 'light'] as const) {
    test(`${route} has no detectable accessibility violations in ${theme} theme`, async ({ page }) => {
      await page.addInitScript((selectedTheme) => localStorage.setItem('edgseu-theme', selectedTheme), theme);
      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }
}

test('Site reflows at 320 CSS pixels without page-level overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const route of dynamicRoutes) {
    await page.goto(route);
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(dimensions.width, `${route} overflowed horizontally`).toBeLessThanOrEqual(dimensions.viewport);
  }
});

test('skip link is first and focus is visibly targetable', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await skip.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('reduced motion removes smooth scrolling and transitions', async ({ page }) => {
  const targetRoute = publishedArticles.length > 0 && publishedArticles[0] ? publishedArticles[0].path : '/';
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(targetRoute);
  const styles = await page.evaluate(() => ({
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
    progress: getComputedStyle(document.querySelector('.outline-progress-bar') ?? document.body).transitionDuration,
  }));
  expect(styles.scroll).toBe('auto');
  expect(Number.parseFloat(styles.progress)).toBeLessThanOrEqual(0.001);
});

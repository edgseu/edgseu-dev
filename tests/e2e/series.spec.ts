import { expect, test } from '@playwright/test';
import { publishedArticles, seriesSlug } from '../helpers/test-articles';

const seriesArticles = publishedArticles.filter((article) => article.frontmatter.series && article.frontmatter.seriesSlug);
const seriesNames = [
  ...new Set(seriesArticles.map((article) => article.frontmatter.series as string)),
];

test('articles index shows the series rail with a pressed Show all button by default', async ({ page }) => {
  test.skip(seriesNames.length === 0, 'No published article declares a series');
  await page.goto('/articles/');
  const rail = page.locator('[data-series-rail]');
  await expect(rail).toBeVisible();
  await expect(rail.locator('.series-filter[data-series-filter=""]')).toHaveAttribute('aria-pressed', 'true');
  expect(await rail.locator('.series-filter[data-series-filter=""]').textContent()).toContain('Show all');
  for (const name of seriesNames) {
    await expect(rail.locator('.series-filter', { hasText: name })).toBeVisible();
  }
  await expect(page.locator('[data-article-list] > .article-card[hidden]')).toHaveCount(0);
});

test('clicking a series filters the list and updates the URL, Show all resets it', async ({ page }) => {
  test.skip(seriesNames.length === 0, 'No published article declares a series');
  const name = seriesNames[0] as string;
  const slug = seriesSlug(name);
  await page.goto('/articles/');
  await page.locator(`[data-series-rail] .series-filter[data-series-filter="${slug}"]`).click();

  await expect(page).toHaveURL(new RegExp(`series=${slug}`));
  const cards = page.locator('[data-article-list] > .article-card');
  const visibleCount = await cards.evaluateAll(
    (elements) => elements.filter((element) => !(element as HTMLElement).hidden).length,
  );
  const expectedCount = seriesArticles.filter((article) => article.frontmatter.series === name).length;
  expect(visibleCount).toBe(expectedCount);
  await expect(page.locator(`.article-card[data-series="${slug}"]`).first()).toBeVisible();
  await expect(page.locator(`[data-series-rail] .series-filter[data-series-filter="${slug}"]`)).toHaveAttribute('aria-pressed', 'true');

  await page.locator('[data-series-rail] .series-filter[data-series-filter=""]').click();
  await expect(page).toHaveURL(/\/articles\/$/);
  await expect(page.locator('[data-article-list] > .article-card[hidden]')).toHaveCount(0);
});

test('a deep link to /articles/?series= preselects the series filter', async ({ page }) => {
  test.skip(seriesNames.length === 0, 'No published article declares a series');
  const name = seriesNames[0] as string;
  const slug = seriesSlug(name);
  await page.goto(`/articles/?series=${slug}`);
  await expect(page.locator(`[data-series-rail] .series-filter[data-series-filter="${slug}"]`)).toHaveAttribute('aria-pressed', 'true');
  const expectedCount = seriesArticles.filter((article) => article.frontmatter.series === name).length;
  await expect(page.locator('[data-article-list] > .article-card:not([hidden])')).toHaveCount(expectedCount);
});

test('an article in a series shows the series card linking back to the filtered index', async ({ page }) => {
  test.skip(seriesArticles.length === 0, 'No published article declares a series');
  const target = seriesArticles[0];
  const slug = target?.frontmatter.seriesSlug as string;
  await page.goto(target?.path ?? '/');
  const seriesCard = page.locator('.article-aside .article-series-card');
  await expect(seriesCard).toBeVisible();
  await expect(seriesCard.locator('.series-name')).toHaveText(target?.frontmatter.series as string);

  await seriesCard.locator('.series-link').click();
  await expect(page).toHaveURL(new RegExp(`/articles/\\?series=${slug}`));
  await expect(page.locator(`[data-series-rail] .series-filter[data-series-filter="${slug}"]`)).toHaveAttribute('aria-pressed', 'true');
});

test('an article without a series shows no series card', async ({ page }) => {
  const plain = publishedArticles.find((article) => !article.frontmatter.series);
  test.skip(!plain, 'All published articles declare a series');
  await page.goto(plain?.path ?? '/');
  await expect(page.locator('.article-series-card')).toHaveCount(0);
});

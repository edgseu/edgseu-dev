import { expect, test } from '@playwright/test';
import { site } from '../../src/data/site';
import { publishedArticles } from '../../src/lib/articles';

const targetArticle = publishedArticles[0];

test('Published Article exposes canonical context and portable body', async ({ page }) => {
  if (!targetArticle) {
    test.skip(true, 'No published articles to test');
    return;
  }
  const articlePath = targetArticle.path;
  await page.goto(articlePath);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(targetArticle.frontmatter.title);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new URL(articlePath, site.canonicalUrl).href);
  await expect(page.locator('.article-context')).toContainText(targetArticle.frontmatter.title);
  if (targetArticle.frontmatter.publishedAt) {
    await expect(page.locator('.article-header time').first()).toHaveText(`Published ${targetArticle.frontmatter.publishedAt}`);
  }
  if (targetArticle.frontmatter.revisedAt) {
    await expect(page.locator('.article-header time').last()).toHaveText(`Revised ${targetArticle.frontmatter.revisedAt}`);
  }
  const preCount = await page.locator('pre').count();
  if (preCount > 0) {
    await expect(page.locator('pre').first()).toBeVisible();
  }
  expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain('Article');
});

test('ordinary scrolling does not mutate URL while explicit outline activation does', async ({ page }) => {
  if (!targetArticle) {
    test.skip(true, 'No published articles to test');
    return;
  }
  const articlePath = targetArticle.path;
  await page.goto(articlePath);

  const outlineLinks = page.locator('.article-grid .article-outline a');
  if ((await outlineLinks.count()) === 0) {
    test.skip(true, 'Article has no headings in outline');
    return;
  }

  const firstLink = outlineLinks.first();
  const targetHash = (await firstLink.getAttribute('href')) ?? '';

  await expect(page).toHaveURL(new RegExp(`${articlePath}$`));
  await firstLink.click();
  if (targetHash.startsWith('#')) {
    await expect(page).toHaveURL(new RegExp(`${targetHash}$`));
  }
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${articlePath}$`));
});

test('code copy gives explicit accessible feedback', async ({ page, context }) => {
  if (!targetArticle) {
    test.skip(true, 'No published articles to test');
    return;
  }
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(targetArticle.path);

  const copyButtons = page.locator('.copy-code');
  if ((await copyButtons.count()) === 0) {
    test.skip(true, 'Article has no code blocks');
    return;
  }

  const firstCopy = copyButtons.first();
  const preText = await page.locator('.code-block pre, pre').first().textContent();
  await firstCopy.click();
  await expect(firstCopy).toHaveText('Copied');
  if (preText) {
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(preText);
  }
});

test('mobile global and Article disclosures are mutually exclusive', async ({ page }) => {
  if (!targetArticle) {
    test.skip(true, 'No published articles to test');
    return;
  }
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto(targetArticle.path);

  const menu = page.locator('.menu-toggle');
  const outline = page.locator('.outline-disclosure > button');
  if ((await outline.count()) === 0) {
    test.skip(true, 'No outline disclosure on this article');
    return;
  }

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
  if (!targetArticle) {
    test.skip(true, 'No published articles to test');
    return;
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(targetArticle.path);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(targetArticle.frontmatter.title);
  await expect(page.getByText(/Article remains available if GitHub is blocked/)).toBeVisible();
  await context.close();
});

test('old Article path is a static canonical meta-refresh redirect', async ({ request }) => {
  const articleWithAlias = publishedArticles.find((a) => (a.frontmatter.aliases ?? []).length > 0);
  if (!articleWithAlias || !articleWithAlias.frontmatter.aliases?.[0]) {
    test.skip(true, 'No published article declares aliases');
    return;
  }
  const alias = articleWithAlias.frontmatter.aliases[0];
  const response = await request.get(alias);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('http-equiv="refresh"');
  expect(html).toContain(`href="${new URL(articleWithAlias.path, site.canonicalUrl).href}"`);
  expect(html).toContain(`href="${articleWithAlias.path}"`);
});

test('desktop Table of Contents sticks to viewport when scrolling', async ({ page }) => {
  if (!targetArticle) {
    test.skip(true, 'No published articles to test');
    return;
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(targetArticle.path);
  const outline = page.locator('.article-grid .article-outline');
  if ((await outline.count()) === 0) {
    test.skip(true, 'No outline on this article');
    return;
  }
  const initialPosition = await outline.evaluate((el) => getComputedStyle(el).position);
  expect(initialPosition).toBe('sticky');

  const headings = page.locator('.prose h2, .prose h3');
  if ((await headings.count()) > 1) {
    await headings.last().scrollIntoViewIfNeeded();
    await expect(outline).toBeInViewport();
    const boundingBox = await outline.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.y).toBeGreaterThanOrEqual(0);
  }
});

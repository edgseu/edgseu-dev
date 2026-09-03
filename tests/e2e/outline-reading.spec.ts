import { test, expect } from '@playwright/test';

test('scrolling up recedes the outline monotonically back to the top', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/articles/kvm-windows-optimization/');

  // start at the very end: outline maxed out
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(900);

  const headings = page.locator('.prose h2');
  const count = await headings.count();
  const outline = page.locator('.article-aside .article-outline');
  const samples: Array<{ heading: string; tocTop: number; active: string | null }> = [];

  for (let i = count - 1; i >= 0; i--) {
    const heading = headings.nth(i);
    await heading.evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(650); // let the smooth outline animation settle
    samples.push({
      heading: (await heading.textContent()) ?? `#${i}`,
      tocTop: await outline.evaluate((el) => el.scrollTop),
      active: await page.locator('.article-aside .article-outline a[aria-current="location"]').textContent().catch(() => null),
    });
  }

  // while reading upward the outline scroll position must never increase
  for (let i = 1; i < samples.length; i++) {
    const delta = samples[i]!.tocTop - samples[i - 1]!.tocTop;
    expect(delta, `upward jump between "${samples[i - 1]!.heading}" and "${samples[i]!.heading}": ${JSON.stringify([samples[i - 1], samples[i]])}`).toBeLessThanOrEqual(0);
  }
  // back at the top of the article, the outline is parked at the top
  expect(samples.at(-1)?.tocTop).toBe(0);
  // and the first entry is the active one
  expect(samples.at(-1)?.active).toContain('Prerequisites');
  await page.screenshot({ path: '.debug/up-final.png' });
});

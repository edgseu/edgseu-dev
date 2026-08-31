import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { chromium } from '@playwright/test';

test('local development renders Draft at its eventual path with a banner', async () => {
  const server = spawn(join(process.cwd(), 'node_modules/.bin/astro'), [
    'dev', '--host', '127.0.0.1', '--port', '4322',
  ], { stdio: 'ignore' });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      try {
        const response = await fetch('http://127.0.0.1:4322/articles/draft-preview/');
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {
        // Dev server is still starting.
      }
      await delay(200);
    }
    assert.equal(ready, true, 'Astro dev server did not become ready');
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto('http://127.0.0.1:4322/articles/draft-preview/');
      assert.equal(await page.locator('main h1').textContent(), 'Draft preview');
      assert.match(await page.locator('.draft-banner').textContent() ?? '', /not included in production/);
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
    } finally {
      await browser.close();
    }
  } finally {
    server.kill('SIGTERM');
  }
});

import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const html = path.join(root, 'docs/assets/browser-jockey-true-signal-flow.html');
const png = path.join(root, 'docs/assets/browser-jockey-true-signal-flow.png');

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1100 },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
  await page.screenshot({
    path: png,
    clip: { x: 0, y: 0, width: 1600, height: 1100 },
  });
} finally {
  await browser.close();
}

console.log(png);

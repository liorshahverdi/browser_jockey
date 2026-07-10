import { test, expect } from '@playwright/test';

test('GitHub Pages build boots from the project subpath', async ({ page }) => {
  const pageErrors = [];
  const failedLocalRequests = [];
  const consoleMessages = [];

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => consoleMessages.push(`${message.type()}: ${message.text()}`));
  page.on('response', response => {
    const url = response.url();
    if (url.includes('/browser_jockey/') && response.status() >= 400) {
      failedLocalRequests.push(`${response.status()} ${url}`);
    }
  });

  await page.goto('/browser_jockey/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Browser Jockey/);
  await expect(page.locator('#audioFile1')).toHaveCount(1);
  await expect(page.locator('#sequencerPlayBtn')).toHaveCount(1);
  await expect(page.locator('#lofiPlay')).toHaveCount(1);

  await page.locator('#lofiPlay').click();
  await expect.poll(
    () => consoleMessages.some(message => message.includes('Timestretch AudioWorklet processor loaded')),
    { timeout: 15_000 }
  ).toBe(true);

  const workletStatus = await page.evaluate(async () => {
    const url = new URL('./app/static/js/timestretch-processor.js', document.baseURI);
    return (await fetch(url)).status;
  });
  expect(workletStatus).toBe(200);
  expect(failedLocalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('page shutdown closes the owned AudioContext', async ({ page }) => {
  let closedContexts = 0;
  await page.exposeFunction('__reportAudioContextClose', () => { closedContexts += 1; });
  await page.addInitScript(() => {
    const Context = window.AudioContext || window.webkitAudioContext;
    const originalClose = Context.prototype.close;
    Context.prototype.close = function(...args) {
      window.__reportAudioContextClose();
      return originalClose.apply(this, args);
    };
  });

  await page.goto('/browser_jockey/', { waitUntil: 'domcontentloaded' });
  await page.locator('#lofiPlay').click();
  await page.goto('about:blank');
  await expect.poll(() => closedContexts).toBeGreaterThan(0);
});

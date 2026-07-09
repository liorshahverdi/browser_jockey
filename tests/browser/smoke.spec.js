const { test, expect } = require('@playwright/test');

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

  // This user gesture initializes the AudioContext and loads the AudioWorklet.
  await page.locator('#lofiPlay').click();
  await expect.poll(
    () => consoleMessages.some(message => message.includes('Timestretch AudioWorklet processor loaded')),
    { timeout: 15_000 }
  ).toBe(true);

  // Fetching the same resolved asset also gives us an explicit HTTP status check.
  const workletStatus = await page.evaluate(async () => {
    const url = new URL('./app/static/js/timestretch-processor.js', document.baseURI);
    return (await fetch(url)).status;
  });
  expect(workletStatus).toBe(200);
  expect(failedLocalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

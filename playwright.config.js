const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
  },
  webServer: {
    command: 'python3 scripts/serve_pages.py',
    url: 'http://127.0.0.1:4173/browser_jockey/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});

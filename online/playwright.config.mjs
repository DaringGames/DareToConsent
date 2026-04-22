import { defineConfig } from '@playwright/test';

const port = process.env.PORT || '3001';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    browserName: 'chromium',
    headless: true,
    locale: 'en-US',
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: `PORT=${port} node server/index.js`,
    url: `${baseURL}/health`,
    reuseExistingServer: true,
    timeout: 15_000
  }
});

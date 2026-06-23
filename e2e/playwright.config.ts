import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  timeout: 10000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    headless: true,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'bun run dev',
        cwd: '../frontend',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
      },
});

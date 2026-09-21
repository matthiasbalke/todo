import { defineConfig, devices } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

function localDomainBaseURL(): string | undefined {
  const domainFile = '../.local-domain';
  if (!existsSync(domainFile)) {
    return undefined;
  }
  const domain = readFileSync(domainFile, 'utf8').replaceAll('\r', '').trim();
  return domain ? `https://${domain}` : undefined;
}

const baseURL = process.env.BASE_URL ?? localDomainBaseURL() ?? 'http://localhost:5173';
const chromiumHostResolverRules = process.env.CHROMIUM_HOST_RESOLVER_RULES;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  timeout: 30000,
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
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: chromiumHostResolverRules
          ? { args: [`--host-resolver-rules=${chromiumHostResolverRules}`] }
          : undefined,
      },
      dependencies: ['setup'],
    },
  ],
  webServer: baseURL !== 'http://localhost:5173'
    ? undefined
    : {
        command: 'bun run dev',
        cwd: '../frontend',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
      },
});

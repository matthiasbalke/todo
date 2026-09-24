import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { addVirtualAuthenticator, waitForHydration } from './helpers';

const adminStorageState = '.auth/admin.json';

interface AppSettings {
	registrationEnabled: boolean;
	publicBaseUrl: string;
}

async function registrationEnabled(page: import('@playwright/test').Page): Promise<boolean> {
	const config = await page.request.get('/api/auth/config');
	expect(config.ok()).toBe(true);
	return ((await config.json()) as { registrationEnabled: boolean }).registrationEnabled;
}

async function enableRegistration(page: import('@playwright/test').Page): Promise<void> {
	const refresh = await page.request.post('/api/auth/refresh', {
		data: {},
	});
	expect(refresh.ok()).toBe(true);
	const { accessToken } = (await refresh.json()) as { accessToken: string };
	const headers = {
		Authorization: `Bearer ${accessToken}`,
	};
	const settingsResponse = await page.request.get('/api/admin/settings/app', { headers });
	expect(settingsResponse.ok()).toBe(true);
	const settings = (await settingsResponse.json()) as AppSettings;
	const response = await page.request.patch('/api/admin/settings/app', {
		headers,
		data: { ...settings, registrationEnabled: true },
	});
	expect(response.ok()).toBe(true);
}

async function waitForSetupResult(page: import('@playwright/test').Page, setupSecret: string): Promise<void> {
	const result = await Promise.race([
		page.waitForURL('**/admin/settings').then(() => 'admin' as const),
		page.getByText('Setup secret is invalid. Check the backend logs and try again.').waitFor({ timeout: 10_000 }).then(() => 'invalid-secret' as const),
	]);

	if (result === 'invalid-secret') {
		throw new Error(
			`First-admin setup failed because the backend did not accept the E2E setup secret "${setupSecret}". ` +
			'Start the backend with SETUP_SECRET matching the test environment, for example SETUP_SECRET=e2e-setup-secret, or export SETUP_SECRET with the backend log secret before running E2E.'
		);
	}
}

test('creates the first admin when setup is required', async ({ page, context }) => {
	const setupSecret = process.env.SETUP_SECRET ?? 'e2e-setup-secret';
	const status = await page.request.get('/api/setup');
	expect(status.ok()).toBe(true);
	const body = (await status.json()) as { setupRequired: boolean };
	if (!body.setupRequired) {
		expect(
			await registrationEnabled(page),
			'Registration is disabled on an already-initialized E2E target. Enable registration before running browser E2E tests, or run against a fresh E2E stack so setup can enable it.'
		).toBe(true);
		return;
	}

	await page.goto('/setup');
	await waitForHydration(page);

	const cdp = await context.newCDPSession(page);
	await addVirtualAuthenticator(cdp);

	await page.getByLabel('Display name').fill('E2E Admin');
	await page.getByLabel('Email').fill(`e2e-admin-${Date.now()}@example.com`);
	await page.getByLabel('Setup secret').fill(setupSecret);
	await page.getByLabel('Passkey name (optional)').fill('E2E setup passkey');
	await page.getByRole('button', { name: /Create admin passkey/ }).click();

	await waitForSetupResult(page, setupSecret);
	await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
	await enableRegistration(page);
	await mkdir('.auth', { recursive: true });
	await page.context().storageState({ path: adminStorageState });
});

import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { addVirtualAuthenticator, waitForHydration } from './helpers';

const adminStorageState = '.auth/admin.json';

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
	const response = await page.request.patch('/api/admin/settings/registration', {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
		data: { registrationEnabled: true },
	});
	expect(response.ok()).toBe(true);
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

	await page.waitForURL('**/admin');
	await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
	await enableRegistration(page);
	await mkdir('.auth', { recursive: true });
	await page.context().storageState({ path: adminStorageState });
});

import { test, expect } from '@playwright/test';
import { addVirtualAuthenticator, waitForHydration } from './helpers';

test('creates the first admin when setup is required', async ({ page, context }) => {
	const setupSecret = process.env.SETUP_SECRET ?? 'e2e-setup-secret';
	const status = await page.request.get('/api/setup');
	expect(status.ok()).toBe(true);
	const body = (await status.json()) as { setupRequired: boolean };
	if (!body.setupRequired) return;

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
});

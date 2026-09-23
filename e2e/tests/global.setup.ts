import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { addVirtualAuthenticator, waitForHydration } from './helpers';

const adminStorageState = '.auth/admin.json';
const mailpitHost = process.env.MAILPIT_HOST ?? localMailpitHost();
const starttlsSmtpHost = process.env.MAILPIT_STARTTLS_SMTP_HOST ?? mailpitHost ?? 'mailpit-starttls';
const starttlsSmtpPort = Number(process.env.MAILPIT_STARTTLS_SMTP_PORT ?? '1025');

interface AppSettings {
	registrationEnabled: boolean;
	publicBaseUrl: string;
}

async function registrationEnabled(page: import('@playwright/test').Page): Promise<boolean> {
	const config = await page.request.get('/api/auth/config');
	expect(config.ok()).toBe(true);
	return ((await config.json()) as { registrationEnabled: boolean }).registrationEnabled;
}

function localMailpitHost(): string | undefined {
	if (process.env.LOCAL_HTTPS_DOMAIN) return process.env.LOCAL_HTTPS_DOMAIN;
	if (process.env.BASE_URL) return new URL(process.env.BASE_URL).hostname;
	if (existsSync('../.local-domain')) return readFileSync('../.local-domain', 'utf8').trim();
	return undefined;
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

async function configureDefaultEmailDelivery(page: import('@playwright/test').Page): Promise<void> {
	const refresh = await page.request.post('/api/auth/refresh', {
		data: {},
	});
	expect(refresh.ok()).toBe(true);
	const { accessToken } = (await refresh.json()) as { accessToken: string };
	const headers = {
		Authorization: `Bearer ${accessToken}`,
	};
	const response = await page.request.patch('/api/admin/settings/email', {
		headers,
		data: {
			enabled: true,
			authEnabled: false,
			host: starttlsSmtpHost,
			port: starttlsSmtpPort,
			protocol: 'smtp',
			encryption: 'STARTTLS',
			username: null,
			passwordAction: 'CLEAR',
			password: null,
			from: 'todo-e2e@example.com',
			fromName: 'Todo E2E',
		},
	});
	expect(response.ok()).toBe(true);
}

async function validateAdminStorageState(page: import('@playwright/test').Page): Promise<boolean> {
	if (!existsSync(adminStorageState)) return false;
	const storage = JSON.parse(readFileSync(adminStorageState, 'utf8')) as {
		cookies?: Array<{ name: string; value: string; expires?: number }>;
		origins?: unknown[];
	};
	const refreshCookie = storage.cookies?.find((cookie) => cookie.name === 'refreshToken');
	if (!refreshCookie) return false;
	const refresh = await page.request.post('/api/auth/refresh', {
		headers: { Cookie: `refreshToken=${refreshCookie.value}` },
		data: {},
	});
	if (!refresh.ok()) return false;
	const body = (await refresh.json()) as { user?: { admin?: boolean } };
	if (body.user?.admin !== true) return false;
	const setCookie = refresh.headers()['set-cookie'] ?? '';
	const refreshedToken = setCookie.match(/(?:^|,\s*)refreshToken=([^;]+)/)?.[1];
	if (refreshedToken) {
		refreshCookie.value = refreshedToken;
		refreshCookie.expires = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
		await mkdir('.auth', { recursive: true });
		await writeFile(adminStorageState, `${JSON.stringify({ cookies: storage.cookies ?? [], origins: storage.origins ?? [] }, null, 2)}\n`);
	}
	return true;
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
		if (!(await validateAdminStorageState(page))) {
			await rm(adminStorageState, { force: true });
			console.warn(`Removed stale ${adminStorageState}; admin-only E2E specs will be skipped until it is regenerated.`);
		}
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
	await configureDefaultEmailDelivery(page);
	await enableRegistration(page);
	await mkdir('.auth', { recursive: true });
	await page.context().storageState({ path: adminStorageState });
});

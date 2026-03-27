/**
 * Passkey (WebAuthn) e2e tests.
 *
 * Each test provisions a virtual FIDO2 authenticator via the Chrome DevTools
 * Protocol before the page loads. The authenticator silently completes every
 * WebAuthn ceremony (register / authenticate) without any UI interaction, which
 * is the standard way to drive WebAuthn flows in Playwright.
 *
 * Prerequisites: backend running on http://localhost:8080
 * (proxied to /api by the Vite dev server on port 5173).
 */

import { test, expect } from '@playwright/test';
import type { BrowserContext, CDPSession, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function addVirtualAuthenticator(cdp: CDPSession): Promise<void> {
	await cdp.send('WebAuthn.enable', { enableUI: false });
	await cdp.send('WebAuthn.addVirtualAuthenticator', {
		options: {
			protocol: 'ctap2',
			transport: 'internal',
			hasResidentKey: true, // required for discoverable credentials
			hasUserVerification: true, // required for userVerification: required
			isUserVerified: true, // auto-approve every ceremony
		},
	});
}

async function waitForHydration(page: Page): Promise<void> {
	await page.waitForSelector('body[data-hydrated="true"]');
}

let emailCounter = 0;
function uniqueEmail(): string {
	emailCounter += 1;
	return `e2e-${Date.now()}-${emailCounter}@example.com`;
}

// Register a new account and land on /lists.
async function registerPasskey(
	page: Page,
	context: BrowserContext,
	displayName: string,
	email: string,
): Promise<void> {
	const cdp = await context.newCDPSession(page);
	await addVirtualAuthenticator(cdp);

	await page.goto('/auth');
	await waitForHydration(page);

	await page.getByRole('button', { name: 'Create account' }).click();
	await page.getByPlaceholder('Your name').fill(displayName);
	await page.getByPlaceholder('you@example.com').fill(email);
	await page.getByRole('button', { name: /Register passkey/ }).click();

	await page.waitForURL('**/lists');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Passkey registration', () => {
	test('fills form → passkey ceremony → redirects to /lists', async ({ page, context }) => {
		const cdp = await context.newCDPSession(page);
		await addVirtualAuthenticator(cdp);

		await page.goto('/auth');
		await waitForHydration(page);

		await page.getByRole('button', { name: 'Create account' }).click();
		await page.getByPlaceholder('Your name').fill('E2E User');
		await page.getByPlaceholder('you@example.com').fill(uniqueEmail());

		await page.getByRole('button', { name: /Register passkey/ }).click();

		await page.waitForURL('**/lists');
		await expect(page).toHaveURL(/\/lists$/);
	});

	test('display name appears in header after registration', async ({ page, context }) => {
		const displayName = 'Alice Passkey';
		await registerPasskey(page, context, displayName, uniqueEmail());

		await expect(page.getByRole('button', { name: 'User menu' })).toContainText(displayName);
	});
});

test.describe('Passkey sign-in', () => {
	test('sign in with passkey after logging out', async ({ page, context }) => {
		// Register first — the virtual authenticator stores the credential in memory.
		const cdp: CDPSession = await context.newCDPSession(page);
		await addVirtualAuthenticator(cdp);

		await page.goto('/auth');
		await waitForHydration(page);
		await page.getByRole('button', { name: 'Create account' }).click();
		await page.getByPlaceholder('Your name').fill('Bob Passkey');
		await page.getByPlaceholder('you@example.com').fill(uniqueEmail());
		await page.getByRole('button', { name: /Register passkey/ }).click();
		await page.waitForURL('**/lists');

		// Log out.
		await page.getByRole('button', { name: 'User menu' }).click();
		await page.getByRole('button', { name: 'Log out' }).click();
		await page.waitForURL('**/auth');

		// Sign in — virtual authenticator auto-selects the stored credential because
		// login-options returns empty allowCredentials (discoverable credential flow).
		await page.getByRole('button', { name: /Sign in with Passkey/ }).click();

		await page.waitForURL('**/lists');
		await expect(page).toHaveURL(/\/lists$/);
	});
});

test.describe('Session management', () => {
	test('session survives a full page reload via refresh token cookie', async ({
		page,
		context,
	}) => {
		await registerPasskey(page, context, 'Carol Passkey', uniqueEmail());

		await page.reload();
		await waitForHydration(page);

		// restoreSession() in the auth guard calls /api/auth/refresh on reload.
		// The HttpOnly refresh token cookie is sent automatically, so the user
		// should remain on /lists without being redirected to /auth.
		await expect(page).toHaveURL(/\/lists$/);
	});

	test('logout revokes session — navigating to /lists redirects to /auth', async ({
		page,
		context,
	}) => {
		await registerPasskey(page, context, 'Dave Passkey', uniqueEmail());

		await page.getByRole('button', { name: 'User menu' }).click();
		await page.getByRole('button', { name: 'Log out' }).click();
		await page.waitForURL('**/auth');

		// The refresh token cookie has been cleared; /lists must redirect back to /auth.
		await page.goto('/lists');
		await page.waitForURL('**/auth');
		await expect(page).toHaveURL(/\/auth/);
	});
});

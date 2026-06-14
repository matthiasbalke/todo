/**
 * Passkey (WebAuthn) e2e tests.
 *
 * Each test provisions a virtual FIDO2 authenticator via the Chrome DevTools
 * Protocol *after* the page has navigated to the app origin. The CDP WebAuthn
 * domain must be enabled on an active page context (not before any navigation),
 * otherwise the authenticator is not wired up to the correct security origin
 * and every ceremony silently times out.
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
// The virtual authenticator is set up AFTER page.goto() so the CDP session is
// bound to the correct security origin.
async function registerPasskey(
	page: Page,
	context: BrowserContext,
	displayName: string,
	email: string,
): Promise<void> {
	await page.goto('/auth');
	await waitForHydration(page);

	const cdp = await context.newCDPSession(page);
	await addVirtualAuthenticator(cdp);

	await page.getByRole('button', { name: 'Create account' }).click();
	await page.getByPlaceholder('Your name').fill(displayName);
	await page.getByPlaceholder('you@example.com').fill(email);
	await page.getByRole('button', { name: /Register passkey/ }).click();

	await page.waitForURL('**/lists');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Unauthenticated route guards', () => {
	test('root redirects to auth page', async ({ page }) => {
		await page.goto('/');
		await waitForHydration(page);
		await expect(page).toHaveURL(/\/auth$/);
	});

	test('protected route redirects to auth page', async ({ page }) => {
		await page.goto('/lists');
		await page.waitForURL('**/auth');
		await expect(page).toHaveURL(/\/auth$/);
	});
});

test.describe('Auth page content', () => {
	test('shows welcome heading and sign-in options', async ({ page }) => {
		await page.goto('/auth');
		await waitForHydration(page);
		await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
		await expect(page.getByRole('button', { name: /Sign in with Passkey/ })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
	});
});

test.describe('Passkey registration', () => {
	test('re-registration succeeds after passkey dialog is cancelled', async ({ page, context }) => {
		// Guards the orphan-cleanup fix: register-options saves the user row, the browser
		// cancels the passkey dialog (startRegistration throws before submitRegistration is
		// called), the user is orphaned. The next register-options call with the same email
		// must clean up the orphan and return 200 so the retry can complete.

		const email = uniqueEmail();
		await page.goto('/auth');
		await waitForHydration(page);

		const cdp = await context.newCDPSession(page);
		// Add a virtual authenticator so the retry ceremony can succeed.
		await addVirtualAuthenticator(cdp);

		// Override navigator.credentials.create in JS to throw NotAllowedError on the
		// first call only (simulating the user cancelling the passkey dialog), then
		// delegate to the real implementation so the retry ceremony succeeds.
		// Newer Chromium no longer immediately rejects when no authenticator is present,
		// so we simulate the cancellation at the JS layer instead.
		await page.evaluate(() => {
			let cancelled = false;
			const originalCreate = navigator.credentials.create.bind(navigator.credentials);
			navigator.credentials.create = async function (options?: CredentialCreationOptions) {
				if (!cancelled) {
					cancelled = true;
					throw new DOMException('Operation not allowed', 'NotAllowedError');
				}
				return originalCreate(options);
			};
		});

		await page.getByRole('button', { name: 'Create account' }).click();
		await page.getByPlaceholder('Your name').fill('E2E Orphan User');
		await page.getByPlaceholder('you@example.com').fill(email);
		await page.getByRole('button', { name: /Register passkey/ }).click();

		// Ceremony fails — error message appears; user is orphaned in the DB
		await expect(page.getByText(/Cancelled|try again/i)).toBeVisible({ timeout: 15000 });

		// Retry: same email is still in the form (mode === 'error' keeps the form visible)
		await page.getByRole('button', { name: /Register passkey/ }).click();

		// Must succeed — not show "This email address is already registered."
		await page.waitForURL('**/lists');
		await expect(page).toHaveURL(/\/lists$/);
	});

	test('fills form → passkey ceremony → redirects to /lists', async ({ page, context }) => {
		await page.goto('/auth');
		await waitForHydration(page);

		const cdp = await context.newCDPSession(page);
		await addVirtualAuthenticator(cdp);

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
		await page.goto('/auth');
		await waitForHydration(page);

		const cdp: CDPSession = await context.newCDPSession(page);
		await addVirtualAuthenticator(cdp);

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
	test('root redirects an authenticated user to /lists', async ({ page, context }) => {
		await registerPasskey(page, context, 'Root Session User', uniqueEmail());

		await page.goto('/');
		await page.waitForURL('**/lists');
		await expect(page).toHaveURL(/\/lists$/);
	});

	test('/auth redirects an authenticated user to /lists', async ({ page, context }) => {
		await registerPasskey(page, context, 'Auth Route User', uniqueEmail());

		await page.goto('/auth');
		await page.waitForURL('**/lists');
		await expect(page).toHaveURL(/\/lists$/);
	});

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

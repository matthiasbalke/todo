/**
 * Account management e2e tests.
 *
 * Guards bug fixes from commits c3d3606 and 665d06a:
 *  - c3d3606: layout $derived(getCurrentUser()) reactivity (display name header update)
 *  - 665d06a: await parent() race condition fix (add passkey from /account)
 *  - 665d06a: inline confirmation UX replacing alert() (remove passkey)
 *
 * Prerequisites: backend running on http://localhost:8080
 * (proxied to /api by the Vite dev server on port 5173).
 */

import { test, expect } from '@playwright/test';
import type { BrowserContext, CDPSession, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers (same patterns as auth.spec.ts)
// ---------------------------------------------------------------------------

async function addVirtualAuthenticator(cdp: CDPSession): Promise<string> {
	await cdp.send('WebAuthn.enable', { enableUI: false });
	const { authenticatorId } = (await cdp.send('WebAuthn.addVirtualAuthenticator', {
		options: {
			protocol: 'ctap2',
			transport: 'internal',
			hasResidentKey: true,
			hasUserVerification: true,
			isUserVerified: true,
		},
	})) as { authenticatorId: string };
	return authenticatorId;
}

async function waitForHydration(page: Page): Promise<void> {
	await page.waitForSelector('body[data-hydrated="true"]');
}

let emailCounter = 0;
function uniqueEmail(): string {
	emailCounter += 1;
	return `e2e-account-${Date.now()}-${emailCounter}@example.com`;
}

async function registerPasskey(
	page: Page,
	context: BrowserContext,
	displayName: string,
	email: string,
): Promise<string> {
	await page.goto('/auth');
	await waitForHydration(page);

	const cdp = await context.newCDPSession(page);
	const authenticatorId = await addVirtualAuthenticator(cdp);

	await page.getByRole('button', { name: 'Create account' }).click();
	await page.getByPlaceholder('Your name').fill(displayName);
	await page.getByPlaceholder('you@example.com').fill(email);
	await page.getByRole('button', { name: /Register passkey/ }).click();

	await page.waitForURL('**/lists');
	return authenticatorId;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Account management', () => {
	test('profile display name update reflects in header without reload', async ({
		page,
		context,
	}) => {
		await registerPasskey(page, context, 'Original Name', uniqueEmail());

		await page.goto('/account');
		await waitForHydration(page);

		// Click the inline Edit button to enter editing mode
		await page.locator('button').filter({ hasText: 'Edit' }).click();

		// Fill the name input (no type attribute) and save with Enter
		await page.locator('input:not([type="email"])').fill('Updated Name');
		await page.locator('input:not([type="email"])').press('Enter');

		// Header must reflect the new name immediately — no reload needed.
		// Guards c3d3606: layout $derived(getCurrentUser()) reactivity fix.
		await expect(page.getByRole('button', { name: 'User menu' })).toContainText('Updated Name');
	});

	test('add a second passkey from /account page', async ({ page, context }) => {
		const firstAuthId = await registerPasskey(page, context, 'Passkey User', uniqueEmail());

		await page.goto('/account');
		await waitForHydration(page);

		// Provision a fresh virtual authenticator for the second passkey ceremony.
		// The CDP session from registerPasskey() is bound to the previous page load;
		// a new CDP session is required after page.goto(). Remove the authenticator
		// created during registration first — Chrome only allows one internal
		// authenticator per environment.
		// Guards 665d06a: await parent() race condition fix.
		const cdp = await context.newCDPSession(page);
		await cdp.send('WebAuthn.enable', { enableUI: false });
		await cdp.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId: firstAuthId });
		await addVirtualAuthenticator(cdp);

		await page.getByText('+ Add passkey for this device').click();
		await page.getByPlaceholder('Label (optional, e.g. My Laptop)').fill('Second Device');
		await page.getByRole('button', { name: 'Add passkey' }).click();

		// The new passkey must appear in the list
		await expect(page.getByText('Second Device')).toBeVisible();
	});

	test('remove passkey via inline confirmation (not alert)', async ({ page, context }) => {
		const firstAuthId = await registerPasskey(page, context, 'Remove User', uniqueEmail());

		await page.goto('/account');
		await waitForHydration(page);

		// Add a second passkey so removing one is allowed (last-passkey guard).
		// Remove the authenticator from registration first — Chrome only allows one
		// internal authenticator per environment.
		const cdp = await context.newCDPSession(page);
		await cdp.send('WebAuthn.enable', { enableUI: false });
		await cdp.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId: firstAuthId });
		await addVirtualAuthenticator(cdp);
		await page.getByText('+ Add passkey for this device').click();
		await page.getByPlaceholder('Label (optional, e.g. My Laptop)').fill('To Remove');
		await page.getByRole('button', { name: 'Add passkey' }).click();
		await expect(page.getByText('To Remove')).toBeVisible();

		// Detect any browser-native dialog (alert/confirm) — there should be none.
		// Guards 665d06a: inline confirmation replaces alert().
		let dialogTriggered = false;
		page.on('dialog', () => {
			dialogTriggered = true;
		});

		// Click "Remove" on the passkey labelled "To Remove"
		const passkeyItem = page.locator('li').filter({ hasText: 'To Remove' });
		await passkeyItem.getByRole('button', { name: 'Remove' }).click();

		// Inline confirmation UI must appear — no browser dialog
		await expect(page.getByRole('button', { name: 'Confirm removal' })).toBeVisible();
		expect(dialogTriggered).toBe(false);

		await page.getByRole('button', { name: 'Confirm removal' }).click();

		// Passkey no longer in list; still no browser dialog
		await expect(passkeyItem).not.toBeVisible();
		expect(dialogTriggered).toBe(false);
	});
});

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
import { addVirtualAuthenticator, completeEmailVerification, registerPasskey, uniqueEmail, waitForHydration } from './helpers';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Account management', () => {
	test('profile display name update reflects in header without reload', async ({
		page,
		context,
	}) => {
		await registerPasskey(page, context, 'Original Name', uniqueEmail('e2e-account'));

		await page.goto('/account');
		await waitForHydration(page);

		// EditableLabel exposes the current value as the accessible name in both
		// display and edit modes.
		await page.getByRole('button', { name: 'Original Name', exact: true }).click();
		const nameInput = page.getByRole('textbox', { name: 'Original Name', exact: true });
		await nameInput.fill('Updated Name');
		await nameInput.press('Enter');

		// Header must reflect the new name immediately — no reload needed.
		// Guards c3d3606: layout $derived(getCurrentUser()) reactivity fix.
		await expect(page.getByRole('button', { name: 'User menu' })).toContainText('Updated Name');
	});

	test('add a second passkey from /account page', async ({ page, context }) => {
		const firstAuthId = await registerPasskey(page, context, 'Passkey User', uniqueEmail('e2e-account'));

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
		const firstAuthId = await registerPasskey(page, context, 'Remove User', uniqueEmail('e2e-account'));

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

	test('email change stays pending until verified and existing passkey still signs in', async ({
		page,
		context,
	}) => {
		const oldEmail = uniqueEmail('e2e-account-old');
		const newEmail = uniqueEmail('e2e-account-new');
		await registerPasskey(page, context, 'Email Change User', oldEmail);

		await page.goto('/account');
		await waitForHydration(page);

		await page.getByRole('button', { name: oldEmail, exact: true }).click();
		const emailInput = page.getByRole('textbox', { name: oldEmail, exact: true });
		await emailInput.fill(newEmail);
		await page.getByRole('button', { name: 'Save' }).click();

		await expect(page.getByText('Verification email sent. Your current email stays active until the new address is verified.')).toBeVisible();
		await expect(page.getByRole('button', { name: oldEmail, exact: true })).toBeVisible();
		await expect(page.getByText('Pending email')).toBeVisible();
		await expect(page.getByText(newEmail)).toBeVisible();

		await page.goto('/verify-email');
		await waitForHydration(page);
		await completeEmailVerification(page, newEmail);
		await page.waitForURL('**/lists');

		await page.goto('/account');
		await waitForHydration(page);
		await expect(page.getByRole('button', { name: newEmail, exact: true })).toBeVisible();
		await expect(page.getByText('Pending email')).toHaveCount(0);

		await page.getByRole('button', { name: 'User menu' }).click();
		await page.getByRole('button', { name: 'Log out' }).click();
		await page.waitForURL('**/auth');

		await page.getByRole('button', { name: /Sign in with Passkey/ }).click();
		await page.waitForURL('**/lists');

		await page.goto('/account');
		await waitForHydration(page);
		await expect(page.getByRole('button', { name: newEmail, exact: true })).toBeVisible();
	});
});

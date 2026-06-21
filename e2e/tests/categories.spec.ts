/**
 * Category config dialog E2E tests.
 *
 * Each test provisions its own user, list, and categories via the real API
 * so tests are fully isolated and do not depend on seed data.
 *
 * Prerequisites: full stack running (backend + frontend via nginx).
 */

import { test, expect } from '@playwright/test';
import type { BrowserContext, CDPSession, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers (mirrored from auth.spec.ts)
// ---------------------------------------------------------------------------

async function addVirtualAuthenticator(cdp: CDPSession): Promise<void> {
	await cdp.send('WebAuthn.enable', { enableUI: false });
	await cdp.send('WebAuthn.addVirtualAuthenticator', {
		options: {
			protocol: 'ctap2',
			transport: 'internal',
			hasResidentKey: true,
			hasUserVerification: true,
			isUserVerified: true,
		},
	});
}

async function waitForHydration(page: Page): Promise<void> {
	await page.waitForSelector('body[data-hydrated="true"]');
}

let emailCounter = 0;
function uniqueEmail(): string {
	emailCounter += 1;
	return `e2e-categories-${Date.now()}-${emailCounter}@example.com`;
}

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
// API setup helper
// ---------------------------------------------------------------------------

async function setupListWithCategories(page: Page): Promise<{ listId: string }> {
	return page.evaluate(async () => {
		const refreshRes = await fetch('/api/auth/refresh', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});
		const { accessToken } = await refreshRes.json();
		const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };

		const list = await fetch('/api/lists', {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({ name: 'E2E Grocery' }),
		}).then((r) => r.json());

		const categoryIds: Record<string, string> = {};
		for (const [name, sortOrder] of [
			['Produce', 1],
			['Dairy', 2],
			['Bakery', 3],
			['Meat', 4],
		]) {
			const cat = await fetch(`/api/lists/${list.id}/categories`, {
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify({ name, sortOrder }),
			}).then((r) => r.json());
			categoryIds[name as string] = cat.id;
		}

		// Add one item to Produce so the category heading is visible on the list page
		await fetch(`/api/lists/${list.id}/items`, {
			method: 'POST',
			credentials: 'include',
			headers,
			body: JSON.stringify({ title: 'Apples', categoryId: categoryIds['Produce'] }),
		});

		return { listId: list.id };
	});
}

async function openCategoryDialog(page: Page): Promise<void> {
	await page.getByRole('button', { name: 'List options' }).click();
	await page.getByRole('button', { name: 'Configure categories' }).click();
	await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Category config dialog', () => {
	let listId: string;

	test.beforeEach(async ({ page, context }) => {
		await registerPasskey(page, context, 'E2E Category User', uniqueEmail());
		({ listId } = await setupListWithCategories(page));
		await page.goto(`/lists/${listId}`);
		await waitForHydration(page);
	});

	test('open dialog', async ({ page }) => {
		await page.getByRole('button', { name: 'List options' }).click();
		await page.getByRole('button', { name: 'Configure categories' }).click();
		await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();
	});

	test('close via ✕ button', async ({ page }) => {
		await openCategoryDialog(page);
		await page.getByRole('button', { name: 'Close' }).click();
		await expect(page.getByRole('heading', { name: 'Categories' })).not.toBeVisible();
	});

	test('close via backdrop click', async ({ page }) => {
		await openCategoryDialog(page);
		// Click near top-left corner of the overlay — outside the centered white panel
		await page.locator('[role="dialog"]').click({ position: { x: 10, y: 10 } });
		await expect(page.getByRole('heading', { name: 'Categories' })).not.toBeVisible();
	});

	test('existing categories are displayed', async ({ page }) => {
		await openCategoryDialog(page);
		const dialog = page.locator('[role="dialog"]');
		await expect(dialog.getByRole('button', { name: 'Produce' })).toBeVisible();
		await expect(dialog.getByRole('button', { name: 'Dairy' })).toBeVisible();
		await expect(dialog.getByRole('button', { name: 'Bakery' })).toBeVisible();
		await expect(dialog.getByRole('button', { name: 'Meat' })).toBeVisible();
	});

	test('drag handles are shown instead of up and down reorder buttons', async ({ page }) => {
		await openCategoryDialog(page);
		const dialog = page.locator('[role="dialog"]');
		await expect(dialog.locator('[aria-label="Drag to reorder category"]')).toHaveCount(4);
		await expect(dialog.getByRole('button', { name: 'Move up' })).toHaveCount(0);
		await expect(dialog.getByRole('button', { name: 'Move down' })).toHaveCount(0);
	});

	test('Add button disabled when input is empty', async ({ page }) => {
		await openCategoryDialog(page);
		await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeDisabled();
	});

	test('add new category via button', async ({ page }) => {
		await openCategoryDialog(page);
		const dialog = page.locator('[role="dialog"]');
		await page.getByPlaceholder('New category name').fill('Frozen');
		await page.getByRole('button', { name: 'Add', exact: true }).click();
		await expect(dialog.getByRole('button', { name: 'Frozen' })).toBeVisible();
		await expect(page.getByPlaceholder('New category name')).toHaveValue('');
	});

	test('add new category via Enter key', async ({ page }) => {
		await openCategoryDialog(page);
		const dialog = page.locator('[role="dialog"]');
		await page.getByPlaceholder('New category name').fill('Beverages');
		await page.getByPlaceholder('New category name').press('Enter');
		await expect(dialog.getByRole('button', { name: 'Beverages' })).toBeVisible();
	});

	test('inline rename via name click — commit with Enter', async ({ page }) => {
		await openCategoryDialog(page);
		const dialog = page.locator('[role="dialog"]');
		await dialog.getByRole('button', { name: 'Produce' }).click();
		// Inline edit input has no placeholder; the footer input has placeholder="New category name"
		const inlineInput = dialog.locator('input:not([placeholder])');
		await expect(inlineInput).toBeVisible();
		await expect(inlineInput).toHaveValue('Produce');
		await inlineInput.fill('Fresh Produce');
		await inlineInput.press('Enter');
		await expect(dialog.getByRole('button', { name: 'Fresh Produce' })).toBeVisible();
		await expect(inlineInput).not.toBeVisible();
	});

	test('inline rename via ✏️ button — commit with ✓', async ({ page }) => {
		await openCategoryDialog(page);
		const dialog = page.locator('[role="dialog"]');
		// Rename buttons ordered: Produce(0), Dairy(1), Bakery(2), Meat(3)
		await dialog.getByRole('button', { name: 'Rename' }).nth(1).click({ force: true });
		const inlineInput = dialog.locator('input:not([placeholder])');
		await inlineInput.fill('Dairy & Eggs');
		await dialog.getByRole('button', { name: 'Save' }).click();
		await expect(dialog.getByRole('button', { name: 'Dairy & Eggs' })).toBeVisible();
	});

	test('cancel inline rename with Escape', async ({ page }) => {
		await openCategoryDialog(page);
		const dialog = page.locator('[role="dialog"]');
		await dialog.getByRole('button', { name: 'Rename' }).nth(2).click({ force: true });
		const inlineInput = dialog.locator('input:not([placeholder])');
		await inlineInput.fill('Baked Goods');
		await page.keyboard.press('Escape');
		await expect(dialog.getByRole('button', { name: 'Bakery' })).toBeVisible();
		await expect(dialog.getByRole('button', { name: 'Baked Goods' })).not.toBeVisible();
	});

	test('delete a category', async ({ page }) => {
		await openCategoryDialog(page);
		const dialog = page.locator('[role="dialog"]');
		await dialog.getByRole('button', { name: 'Delete' }).last().click({ force: true });
		await expect(dialog.getByRole('button', { name: 'Meat' })).not.toBeVisible();
	});

	test('reorder — drag Produce below Dairy', async ({ page }) => {
		await openCategoryDialog(page);
		const dialog = page.locator('[role="dialog"]');
		// Use span[role="button"] to target only category name spans (not action buttons)
		const nameSpans = dialog.locator('span[role="button"]');
		const handles = dialog.locator('[aria-label="Drag to reorder category"]');

		// Verify initial order before moving
		await expect(nameSpans.nth(0)).toHaveText('Produce');
		await expect(nameSpans.nth(1)).toHaveText('Dairy');

		const handleBox = await handles.nth(0).boundingBox();
		const targetRow = nameSpans.nth(1).locator('xpath=ancestor::div[contains(@class,"rounded-lg")]');
		const targetBox = await targetRow.boundingBox();
		if (!handleBox || !targetBox) throw new Error('Missing drag geometry');

		await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
		await page.mouse.down();
		await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 15 });
		await page.mouse.up();

		// Wait for re-render after API call completes (Playwright retries automatically)
		await expect(nameSpans.nth(0)).toHaveText('Dairy');
		await expect(nameSpans.nth(1)).toHaveText('Produce');
	});

	test('renamed category reflected in group header after closing dialog', async ({ page }) => {
		await openCategoryDialog(page);
		const dialog = page.locator('[role="dialog"]');
		await dialog.getByRole('button', { name: 'Produce' }).click();
		const inlineInput = dialog.locator('input:not([placeholder])');
		await inlineInput.fill('Fresh Produce');
		await inlineInput.press('Enter');
		await expect(dialog.getByRole('button', { name: 'Fresh Produce' })).toBeVisible();
		await page.getByRole('button', { name: 'Close' }).click();
		await expect(page.getByRole('heading', { name: /Fresh Produce/i })).toBeVisible();
	});
});

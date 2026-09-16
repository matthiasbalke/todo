/**
 * Item detail page E2E tests.
 *
 * Covers: item detail display and inline editing.
 *
 * Each test provisions its own user, list, and item via the real API.
 *
 * Prerequisites: full stack running (backend + frontend via nginx).
 */

import { test, expect } from '@playwright/test';
import {
	waitForHydration,
	uniqueEmail,
	registerPasskey,
	setupListWithItems,
} from './helpers';

// ---------------------------------------------------------------------------
// Item detail page
// ---------------------------------------------------------------------------

test.describe('Item detail', () => {
	let listId: string;
	let itemId: string;

	test.beforeEach(async ({ page, context }) => {
		await registerPasskey(page, context, 'Item User', uniqueEmail('e2e-items'));
		({ listId, itemIds: [itemId] } = await setupListWithItems(page, 'My List', [
			{ title: 'Apples', notes: 'Get Braeburn if available' },
		]));
	});

	test('navigating to an item shows its title and notes', async ({ page }) => {
		await page.goto(`/lists/${listId}/items/${itemId}`);
		await waitForHydration(page);

		await expect(page.getByPlaceholder('Item title')).toHaveValue('Apples');
		await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible();
		await expect(page.getByTestId('item-form-notes-preview')).toHaveText(
			'Get Braeburn if available',
		);

		await page.getByRole('button', { name: 'Notes' }).click();

		const notesDialog = page.getByRole('dialog', { name: 'Notes' });
		await expect(notesDialog.getByRole('textbox', { name: 'Notes' })).toHaveValue(
			'Get Braeburn if available',
		);
	});

	test('editing the item title autosaves in place and shows updated title on the list', async ({
		page,
	}) => {
		await page.goto(`/lists/${listId}/items/${itemId}`);
		await waitForHydration(page);

		await page.getByPlaceholder('Item title').fill('Apples (Updated)');
		await page.getByPlaceholder('Item title').press('Enter');

		await expect(page).toHaveURL(new RegExp(`/lists/${listId}/items/${itemId}$`));
		await page.getByRole('link', { name: 'Back' }).click();
		await page.waitForURL(`**/lists/${listId}`);
		await expect(page.getByText('Apples (Updated)')).toBeVisible();
	});
});

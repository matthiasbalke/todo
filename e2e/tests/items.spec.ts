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
		await expect(page.getByPlaceholder('Notes (optional)')).toHaveValue(
			'Get Braeburn if available',
		);
		await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
	});

	test('editing the item title and saving navigates back and shows updated title', async ({
		page,
	}) => {
		await page.goto(`/lists/${listId}/items/${itemId}`);
		await waitForHydration(page);

		await page.getByPlaceholder('Item title').fill('Apples (Updated)');
		await page.getByRole('button', { name: 'Save' }).click();

		await page.waitForURL(`**/lists/${listId}`);
		await expect(page.getByText('Apples (Updated)')).toBeVisible();
	});
});

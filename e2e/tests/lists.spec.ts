/**
 * List page E2E tests.
 *
 * Covers: lists page display, list detail (items, form, filter, sort),
 * and grocery mode (collapsible sections, check item, hide checked).
 *
 * Each describe block provisions its own user and data via the real API
 * so tests are fully isolated.
 *
 * Prerequisites: full stack running (backend + frontend via nginx).
 */

import { test, expect } from '@playwright/test';
import type { Page, BrowserContext } from '@playwright/test';
import {
	waitForHydration,
	uniqueEmail,
	registerPasskey,
	setupListWithItems,
	setupListWithCategoriesAndItems,
} from './helpers';

// ---------------------------------------------------------------------------
// Lists page — /lists
// ---------------------------------------------------------------------------

test.describe('Lists page', () => {
	test('shows list cards for created lists', async ({ page, context }) => {
		await registerPasskey(page, context, 'List Viewer', uniqueEmail('e2e-lists'));

		await page.evaluate(async () => {
			const { accessToken } = await fetch('/api/auth/refresh', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			}).then((r) => r.json());
			const h = {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			};
			await fetch('/api/lists', {
				method: 'POST',
				credentials: 'include',
				headers: h,
				body: JSON.stringify({ name: 'Groceries' }),
			});
			await fetch('/api/lists', {
				method: 'POST',
				credentials: 'include',
				headers: h,
				body: JSON.stringify({ name: 'Household' }),
			});
		});

		// Reload to pick up the newly created lists.
		await page.goto('/lists');
		await waitForHydration(page);

		await expect(page.getByRole('heading', { level: 2, name: 'Groceries' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 2, name: 'Household' })).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// List detail — add item form
// ---------------------------------------------------------------------------

test.describe('List detail — add item form', () => {
	let listId: string;

	test.beforeEach(async ({ page, context }) => {
		await registerPasskey(page, context, 'Form User', uniqueEmail('e2e-lists'));
		({ listId } = await setupListWithItems(page, 'My List', []));
		await page.goto(`/lists/${listId}`);
		await waitForHydration(page);
	});

	test('clicking + Add item reveals the form', async ({ page }) => {
		await page.getByRole('button', { name: '+ Add item' }).click();

		await expect(page.getByPlaceholder('Item title')).toBeVisible();
		await expect(page.getByPlaceholder('Notes (optional)')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
	});

	test('filling and submitting the form adds the new item to the list', async ({ page }) => {
		await page.getByRole('button', { name: '+ Add item' }).click();
		await page.getByPlaceholder('Item title').fill('Test Item E2E');
		await page.getByRole('button', { name: 'Add' }).click();

		await expect(page.getByText('Test Item E2E')).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// List detail — category headings
// ---------------------------------------------------------------------------

test.describe('List detail — category headings', () => {
	let listId: string;

	test.beforeEach(async ({ page, context }) => {
		await registerPasskey(page, context, 'Category User', uniqueEmail('e2e-lists'));
		({ listId } = await setupListWithCategoriesAndItems(
			page,
			'Grocery',
			['Produce', 'Dairy', 'Bakery'],
			[
				{ title: 'Apples', categoryIndex: 0 },
				{ title: 'Whole Milk', categoryIndex: 1 },
				{ title: 'Sourdough', categoryIndex: 2 },
			],
		));
		await page.goto(`/lists/${listId}`);
		await waitForHydration(page);
	});

	test('grocery list shows category headings and grouped items', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Produce' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Dairy' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Bakery' })).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// List detail — filter and sort
// ---------------------------------------------------------------------------

test.describe('List detail — filter and sort', () => {
	let listId: string;

	test.beforeEach(async ({ page, context }) => {
		await registerPasskey(page, context, 'Filter Sort User', uniqueEmail('e2e-lists'));
		({ listId } = await setupListWithItems(page, 'My List', [
			{ title: 'Cherry' },
			{ title: 'Apple', starred: true },
			{ title: 'Banana', starred: true },
			{ title: 'Spinach' },
		]));
		await page.goto(`/lists/${listId}`);
		await waitForHydration(page);
	});

	test('filtering to Starred only hides unstarred items', async ({ page }) => {
		// Verify unstarred item is visible before filtering
		await expect(page.getByText('Spinach')).toBeVisible();

		// Open kebab menu → Filter → Starred only
		await page.getByRole('button', { name: 'List options' }).click();
		await page.getByRole('button', { name: /^Filter/ }).click();
		await page.getByRole('button', { name: 'Starred only' }).click();
		await page.keyboard.press('Escape');

		// 2 starred items remain
		await expect(page.getByText('2 items')).toBeVisible();
		await expect(page.getByText('Spinach')).not.toBeVisible();
	});

	test('changing sort to Alphabetical reorders items', async ({ page }) => {
		// Items were created in order: Cherry, Apple, Banana, Spinach
		// After alphabetical sort: Apple, Banana, Cherry, Spinach

		await page.getByRole('button', { name: 'List options' }).click();
		await page.getByRole('button', { name: /^Sort/ }).click();
		await page.getByRole('button', { name: 'Alphabetical' }).click();
		await page.keyboard.press('Escape');

		// All items remain visible
		await expect(page.getByText('Apple')).toBeVisible();
		await expect(page.getByText('Banana')).toBeVisible();
		await expect(page.getByText('Cherry')).toBeVisible();

		// Apple must appear above Cherry in the DOM
		const appleY = await page
			.getByText('Apple')
			.first()
			.boundingBox()
			.then((b) => b?.y ?? 0);
		const cherryY = await page
			.getByText('Cherry')
			.first()
			.boundingBox()
			.then((b) => b?.y ?? 0);
		expect(appleY).toBeLessThan(cherryY);
	});
});

// ---------------------------------------------------------------------------
// Grocery mode
// ---------------------------------------------------------------------------

test.describe('Grocery mode', () => {
	let listId: string;

	test.beforeEach(async ({ page, context }) => {
		await registerPasskey(page, context, 'Grocery User', uniqueEmail('e2e-lists'));
		({ listId } = await setupListWithCategoriesAndItems(
			page,
			'Grocery',
			['Produce', 'Dairy'],
			[
				{ title: 'Apples', categoryIndex: 0 },
				{ title: 'Oranges', categoryIndex: 0 },
				{ title: 'Whole Milk', categoryIndex: 1 },
			],
		));
		await page.goto(`/lists/${listId}/grocery`);
		await waitForHydration(page);
	});

	test('shows collapsible category sections with item counts', async ({ page }) => {
		// Section header buttons are visible
		await expect(page.getByRole('button', { name: /Produce/i }).first()).toBeVisible();
		await expect(page.getByRole('button', { name: /Dairy/i }).first()).toBeVisible();

		// Each section shows an unchecked/total count badge like "2/2"
		const produceSection = page.getByRole('button', { name: /Produce/i }).first();
		await expect(produceSection).toContainText(/\d+\/\d+/);
	});

	test('clicking an item button moves it to checked state', async ({ page }) => {
		const applesButton = page.getByRole('button', { name: /Apples/i });
		await expect(applesButton).toBeVisible();
		await applesButton.click();

		// After clicking, the title span gets line-through
		await expect(
			page.getByRole('button', { name: /Apples/i }).locator('span').filter({ hasText: 'Apples' }),
		).toHaveClass(/line-through/);
	});

	test('hide checked removes done items from view', async ({ page }) => {
		// Check Apples
		const applesButton = page.getByRole('button', { name: /Apples/i });
		await applesButton.click();
		await expect(
			page.getByRole('button', { name: /Apples/i }).locator('span').filter({ hasText: 'Apples' }),
		).toHaveClass(/line-through/);

		// Open kebab menu → Hide checked
		await page.getByRole('button', { name: 'List options' }).click();
		await page.getByRole('button', { name: 'Hide checked' }).click();

		// Apples (now done) should no longer be visible
		await expect(page.getByRole('button', { name: /^Apples/ })).not.toBeVisible();
		// Unchecked items should still be visible
		await expect(page.getByRole('button', { name: /Oranges/i })).toBeVisible();
	});
});

test.describe('Viewer read-only list UI', () => {
	test('keeps list data and navigation visible without shared mutation controls', async ({
		page,
		context,
		browser,
	}, testInfo) => {
		const ownerEmail = uniqueEmail('e2e-viewer-owner');
		const viewerEmail = uniqueEmail('e2e-viewer-member');

		await registerPasskey(page, context, 'Viewer Owner', ownerEmail);

		const viewerContext = await browser.newContext({
			baseURL: testInfo.project.use.baseURL as string,
			ignoreHTTPSErrors: true,
		});
		const viewerPage = await viewerContext.newPage();

		try {
			await registerPasskey(viewerPage, viewerContext, 'Read Only Viewer', viewerEmail);

			const { listId, itemIds: [itemId] } = await setupListWithCategoriesAndItems(
				page,
				'Shared Groceries',
				['Produce'],
				[{ title: 'Apples', notes: 'Braeburn preferred', starred: true, categoryIndex: 0 }],
			);

			await page.evaluate(
				async ({ listId, viewerEmail }) => {
					const { accessToken } = await fetch('/api/auth/refresh', {
						method: 'POST',
						credentials: 'include',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({}),
					}).then((response) => response.json());
					await fetch(`/api/lists/${listId}/members`, {
						method: 'POST',
						credentials: 'include',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${accessToken}`,
						},
						body: JSON.stringify({ email: viewerEmail, role: 'VIEWER' }),
					});
				},
				{ listId, viewerEmail },
			);

			await viewerPage.goto(`/lists/${listId}`);
			await waitForHydration(viewerPage);

			await expect(viewerPage.getByRole('heading', { name: /Shared Groceries/ })).toBeVisible();
			await expect(viewerPage.getByText('Apples')).toBeVisible();
			await expect(viewerPage.getByRole('button', { name: '+ Add item' })).not.toBeVisible();
			await expect(viewerPage.getByRole('button', { name: 'Mark done' })).not.toBeVisible();
			await expect(viewerPage.getByRole('button', { name: 'Unstar' })).not.toBeVisible();
			await expect(viewerPage.getByLabel('Drag to reorder')).not.toBeVisible();

			await viewerPage.getByRole('button', { name: 'List options' }).click();
			await expect(viewerPage.getByRole('button', { name: 'Grocery mode' })).toBeVisible();
			await expect(viewerPage.getByRole('button', { name: 'Members' })).toBeVisible();
			await expect(viewerPage.getByRole('button', { name: 'Configure categories' })).not.toBeVisible();
			await expect(viewerPage.getByRole('button', { name: 'Delete list' })).not.toBeVisible();

			await viewerPage.getByRole('button', { name: 'Members' }).click();
			await expect(viewerPage.getByText(viewerEmail)).toBeVisible();
			await expect(viewerPage.getByPlaceholder('Email address')).not.toBeVisible();
			await expect(viewerPage.getByRole('button', { name: /Remove/ })).not.toBeVisible();
			await viewerPage.getByRole('button', { name: 'Close' }).click();

			await viewerPage.getByText('Apples').click();
			await viewerPage.waitForURL(`**/lists/${listId}/items/${itemId}`);
			await expect(viewerPage.getByRole('heading', { name: 'Apples' })).toBeVisible();
			await expect(viewerPage.getByText('Braeburn preferred')).toBeVisible();
			await expect(viewerPage.getByRole('button', { name: 'Save' })).not.toBeVisible();
			await expect(viewerPage.getByRole('button', { name: 'Delete item' })).not.toBeVisible();

			await viewerPage.goto(`/lists/${listId}/grocery`);
			await waitForHydration(viewerPage);
			await expect(viewerPage.getByText('Apples')).toBeVisible();
			await expect(viewerPage.getByRole('button', { name: 'Apples' })).not.toBeVisible();

			await viewerPage.getByRole('button', { name: 'List options' }).click();
			await expect(viewerPage.getByRole('link', { name: 'Standard mode' })).toBeVisible();
			await expect(viewerPage.getByRole('button', { name: 'Edit list' })).not.toBeVisible();
			await expect(viewerPage.getByRole('button', { name: 'Configure categories' })).not.toBeVisible();
		} finally {
			await viewerContext.close();
		}
	});
});

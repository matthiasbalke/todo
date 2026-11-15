import { test, expect } from '@playwright/test';
import { registerPasskey, setupListWithItems, uniqueEmail, waitForHydration } from './helpers';

test.describe('Create a category while assigning an item', () => {
	let listId: string;
	let itemId: string;

	test.beforeEach(async ({ page, context }) => {
		await registerPasskey(page, context, 'Category Creator', uniqueEmail('e2e-category-create'));
		({ listId, itemIds: [itemId] } = await setupListWithItems(page, 'Category creation', [
			{ title: 'Existing seeds', notes: 'Preserve these notes' }
		]));
	});

	test('Enter creates a category in quick-add without submitting the draft', async ({ page }) => {
		await page.goto(`/lists/${listId}`);
		await waitForHydration(page);
		await page.getByRole('button', { name: 'add item' }).click();
		await page.getByRole('textbox', { name: 'Item title' }).fill('New seeds');
		await page.getByRole('button', { name: 'Category', exact: true }).click();
		const input = page.getByRole('combobox', { name: 'Category', exact: true });
		await input.fill('  Garden  ');
		const creation = page.waitForResponse(response => response.url().endsWith(`/api/lists/${listId}/categories`) && response.request().method() === 'POST');
		await input.press('Enter');
		const response = await creation;
		expect(response.ok()).toBe(true);
		const category = await response.json();
		expect(category).toMatchObject({ name: 'Garden', listId, color: null });
		await expect(page.getByRole('textbox', { name: 'Item title' })).toHaveValue('New seeds');
		await expect(page.getByRole('button', { name: 'Category', exact: true })).toContainText('Garden');
		const itemCreation = page.waitForResponse(response => response.url().endsWith(`/api/lists/${listId}/items`) && response.request().method() === 'POST');
		await page.getByRole('textbox', { name: 'Item title' }).press('Enter');
		const itemResponse = await itemCreation;
		expect(itemResponse.ok()).toBe(true);
		const item = await itemResponse.json();
		expect(item.categoryId).toBe(category.id);
		await page.goto(`/lists/${listId}/items/${item.id}`);
		await waitForHydration(page);
		await expect(page.getByRole('combobox', { name: 'Category', exact: true })).toHaveValue('Garden');
	});

	test('clicking creation autosaves the returned category on an existing item', async ({ page }) => {
		await page.goto(`/lists/${listId}/items/${itemId}`);
		await waitForHydration(page);
		const input = page.getByRole('combobox', { name: 'Category', exact: true });
		await input.fill('Garden');
		const saved = page.waitForResponse(response => response.url().endsWith(`/api/lists/${listId}/items/${itemId}`) && response.request().method() === 'PUT');
		await page.getByRole('option', { name: '+ Create Garden', exact: true }).click();
		expect((await saved).ok()).toBe(true);
		await page.reload();
		await waitForHydration(page);
		await expect(input).toHaveValue('Garden');
		await expect(page.getByRole('textbox', { name: 'Item title' })).toHaveValue('Existing seeds');
		await expect(page.getByTestId('item-form-notes-preview')).toHaveText('Preserve these notes');
		await input.fill(' garden ');
		await expect(page.getByRole('option', { name: /Create/ })).toHaveCount(0);
	});

	for (const role of ['EDITOR', 'VIEWER'] as const) {
		test(`${role.toLowerCase()} category creation follows list permissions`, async ({ page, browser }, testInfo) => {
			const email = uniqueEmail(`e2e-category-${role.toLowerCase()}`);
			const memberContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL as string, ignoreHTTPSErrors: true });
			try {
				const memberPage = await memberContext.newPage();
				await registerPasskey(memberPage, memberContext, role, email);
				const refresh = await page.request.post('/api/auth/refresh', { data: {} });
				expect(refresh.ok()).toBe(true);
				const { accessToken } = await refresh.json();
				const membership = await page.request.post(`/api/lists/${listId}/members`, {
					headers: { Authorization: `Bearer ${accessToken}` }, data: { email, role }
				});
				expect(membership.ok()).toBe(true);
				await memberPage.goto(`/lists/${listId}/items/${itemId}`);
				await waitForHydration(memberPage);
				const input = memberPage.getByRole('combobox', { name: 'Category', exact: true });
				if (role === 'VIEWER') {
					await expect(input).toBeDisabled();
					await expect(memberPage.getByRole('option', { name: /Create/ })).toHaveCount(0);
					const memberRefresh = await memberPage.request.post('/api/auth/refresh', { data: {} });
					expect(memberRefresh.ok()).toBe(true);
					const memberAuth = await memberRefresh.json();
					const forbidden = await memberPage.request.post(`/api/lists/${listId}/categories`, {
						headers: { Authorization: `Bearer ${memberAuth.accessToken}` }, data: { name: 'Forbidden category', color: null, sortOrder: 1 }
					});
					expect(forbidden.status()).toBe(403);
				} else {
					await input.fill('Editor category');
					const creation = memberPage.waitForResponse(response => response.url().endsWith(`/api/lists/${listId}/categories`) && response.request().method() === 'POST');
					await input.press('Enter');
					expect((await creation).ok()).toBe(true);
					await expect(input).toHaveValue('Editor category');
				}
			} finally {
				await memberContext.close();
			}
		});
	}

	test('failed creation retains the previous assignment and supports retry', async ({ page }) => {
		await page.goto(`/lists/${listId}/items/${itemId}`);
		await waitForHydration(page);
		await page.route(`**/api/lists/${listId}/categories`, async route => {
			if (route.request().method() === 'POST') {
				await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Forbidden' }) });
			} else await route.continue();
		});
		const input = page.getByRole('combobox', { name: 'Category', exact: true });
		await input.fill('Garden');
		await input.press('Enter');
		await expect(page.getByRole('alert')).toContainText('Could not create category');
		await expect(input).toHaveValue('Garden');
		await input.press('Escape');
		await expect(input).toHaveValue('assign category');
		await page.unroute(`**/api/lists/${listId}/categories`);
		await input.fill('Garden');
		const saved = page.waitForResponse(response => response.url().endsWith(`/api/lists/${listId}/items/${itemId}`) && response.request().method() === 'PUT');
		await input.press('Enter');
		expect((await saved).ok()).toBe(true);
		await expect(page.getByRole('alert')).toHaveCount(0);
		await page.reload();
		await waitForHydration(page);
		await expect(input).toHaveValue('Garden');
	});
});

test.describe('Category creation on touch devices', () => {
	test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

	test('tap creates and selects a category without submitting quick-add', async ({ page, context }) => {
		await registerPasskey(page, context, 'Touch Creator', uniqueEmail('e2e-category-touch'));
		const { listId } = await setupListWithItems(page, 'Touch list', []);
		await page.goto(`/lists/${listId}`);
		await waitForHydration(page);
		await page.getByRole('button', { name: 'add item' }).tap();
		await page.getByRole('textbox', { name: 'Item title' }).fill('Seeds');
		await page.getByRole('button', { name: 'Category', exact: true }).tap();
		await page.getByRole('combobox', { name: 'Category', exact: true }).fill('Garden');
		await page.getByRole('option', { name: '+ Create Garden', exact: true }).tap();
		await expect(page.getByRole('button', { name: 'Category', exact: true })).toContainText('Garden');
		await expect(page.getByRole('textbox', { name: 'Item title' })).toHaveValue('Seeds');
	});
});

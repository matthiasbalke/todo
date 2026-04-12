import { test, expect } from '@playwright/test';
import { registerPasskey, setupListWithItems, waitForHydration } from './helpers';

test.describe('SSE real-time sync', () => {
	test('item created in one tab appears in another tab without reload', async ({ browser }) => {
		// Use a shared context so both tabs share the same auth session
		const context = await browser.newContext();

		const page1 = await context.newPage();
		const page2 = await context.newPage();

		try {
			// Register user and create a list in page1
			await registerPasskey(page1, context, 'SSE User', `sse-${Date.now()}@example.com`);
			const { listId } = await setupListWithItems(page1, 'SSE Test List', []);

			// Open the list in both tabs
			await page1.goto(`/lists/${listId}`);
			await waitForHydration(page1);

			await page2.goto(`/lists/${listId}`);
			await waitForHydration(page2);

			// Create a new item in tab 2 via the UI
			const newItemTitle = `SSE-Item-${Date.now()}`;
			await page2.getByRole('button', { name: '+ Add item' }).click();
			await page2.getByPlaceholder('Title').fill(newItemTitle);
			await page2.getByRole('button', { name: 'Add' }).click();

			// Assert the submitting tab has exactly one copy (guards against each_key_duplicate race)
			await expect(page2.getByText(newItemTitle)).toHaveCount(1);

			// Assert the item appears in tab 1 WITHOUT reloading
			await expect(page1.getByText(newItemTitle)).toBeVisible();
		} finally {
			await context.close();
		}
	});
});

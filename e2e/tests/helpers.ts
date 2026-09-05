/**
 * Shared E2E test helpers for lists.spec.ts and items.spec.ts.
 */
import type { BrowserContext, CDPSession, Page } from '@playwright/test';

export async function addVirtualAuthenticator(cdp: CDPSession): Promise<void> {
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

export async function waitForHydration(page: Page): Promise<void> {
	await page.waitForSelector('body[data-hydrated="true"]');
}

let emailCounter = 0;
export function uniqueEmail(prefix = 'e2e'): string {
	emailCounter += 1;
	return `${prefix}-${Date.now()}-${emailCounter}@example.com`;
}

export async function registerPasskey(
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

export interface ItemInput {
	title: string;
	starred?: boolean;
	notes?: string | null;
	categoryId?: string | null;
	assignedUserIds?: string[];
}

// ---------------------------------------------------------------------------
// API setup helpers (run inside page.evaluate → browser context)
// ---------------------------------------------------------------------------

export async function setupListWithItems(
	page: Page,
	listName: string,
	items: ItemInput[],
): Promise<{ listId: string; itemIds: string[] }> {
	return page.evaluate(
		async ({ listName, items }) => {
			const { accessToken } = await fetch('/api/auth/refresh', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			}).then((r) => r.json());
			const headers = {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			};

			const list = await fetch('/api/lists', {
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify({ name: listName }),
			}).then((r) => r.json());

			const itemIds: string[] = [];
			for (const item of items) {
				const created = await fetch(`/api/lists/${list.id}/items`, {
					method: 'POST',
					credentials: 'include',
					headers,
					body: JSON.stringify(item),
				}).then((r) => r.json());
				itemIds.push(created.id);
			}

			return { listId: list.id as string, itemIds };
		},
		{ listName, items },
	);
}

export async function setupListWithCategoriesAndItems(
	page: Page,
	listName: string,
	categoryNames: string[],
	items: (ItemInput & { categoryIndex?: number })[],
): Promise<{ listId: string; categoryIds: string[]; itemIds: string[] }> {
	return page.evaluate(
		async ({ listName, categoryNames, items }) => {
			const { accessToken } = await fetch('/api/auth/refresh', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			}).then((r) => r.json());
			const headers = {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			};

			const list = await fetch('/api/lists', {
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify({ name: listName }),
			}).then((r) => r.json());

			const categoryIds: string[] = [];
			for (let i = 0; i < categoryNames.length; i++) {
				const cat = await fetch(`/api/lists/${list.id}/categories`, {
					method: 'POST',
					credentials: 'include',
					headers,
					body: JSON.stringify({ name: categoryNames[i], sortOrder: i + 1 }),
				}).then((r) => r.json());
				categoryIds.push(cat.id as string);
			}

			const itemIds: string[] = [];
			for (const { categoryIndex, ...rest } of items) {
				const body: Record<string, unknown> = { ...rest };
				if (typeof categoryIndex === 'number') {
					body.categoryId = categoryIds[categoryIndex];
				}
				const created = await fetch(`/api/lists/${list.id}/items`, {
					method: 'POST',
					credentials: 'include',
					headers,
					body: JSON.stringify(body),
				}).then((r) => r.json());
				itemIds.push(created.id as string);
			}

			return { listId: list.id as string, categoryIds, itemIds };
		},
		{ listName, categoryNames, items },
	);
}

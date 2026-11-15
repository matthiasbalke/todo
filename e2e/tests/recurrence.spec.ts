import { test, expect, type Page } from '@playwright/test';
import { registerPasskey, setupListWithItems, uniqueEmail, waitForHydration } from './helpers';

interface Rule { intervalUnit: string; intervalValue: number; weekdays?: string[] | null }
interface Item { id: string; title: string; done: boolean; dueDate: string | null; recurrenceRule: Rule | null; parentItemId: string | null }
async function api<T>(page: Page, path: string, method = 'GET', body?: unknown): Promise<T> {
	return page.evaluate(async ({ path, method, body }) => {
		const refresh = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' }).then(response => response.json());
		const response = await fetch(path, {
			method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${refresh.accessToken}` },
			body: body === undefined ? undefined : JSON.stringify(body)
		});
		if (!response.ok) throw new Error(`${method} ${path}: ${response.status}`);
		return response.status === 204 ? null : response.json();
	}, { path, method, body });
}
const recurrenceDialog = (page: Page) => page.getByRole('dialog', { name: 'Recurrence' });
const quickRecurrence = (page: Page) => page.getByRole('region', { name: 'Recurrence', exact: true });
async function mode(page: Page, name: string, quick = false) {
	if (quick) await page.getByRole('button', { name: 'Recurrence', exact: true }).click();
	await page.getByRole('combobox', { name: 'Recurrence' }).click();
	await page.getByRole('option', { name, exact: true }).click();
}
async function unit(page: Page, name: string, quick = false) {
	await (quick ? quickRecurrence(page) : recurrenceDialog(page)).getByRole('combobox', { name: 'Repeat unit' }).click();
	await page.getByRole('option', { name, exact: true }).click();
}
async function createQuickItem(page: Page, title: string) {
	await page.getByRole('button', { name: 'add item', exact: true }).click();
	await page.getByPlaceholder('Item title').fill(title);
}

test.describe('Custom recurrence', () => {
	let listId: string;
	test.beforeEach(async ({ page, context }) => {
		await registerPasskey(page, context, 'Recurrence User', uniqueEmail('e2e-recurrence'));
		({ listId } = await setupListWithItems(page, 'Recurrence schedules', []));
		await page.goto(`/lists/${listId}`);
		await waitForHydration(page);
	});

	test('creates a custom interval, reloads and edits without erasing it', async ({ page }) => {
		await createQuickItem(page, 'Quarterly review');
		await mode(page, 'Custom', true);
		await quickRecurrence(page).getByRole('textbox', { name: 'Repeat every' }).fill('3');
		await unit(page, 'months', true);
		await quickRecurrence(page).getByRole('button', { name: 'Back', exact: true }).click();
		await expect(page.getByPlaceholder('Item title')).toBeFocused();
		await expect(page.getByRole('button', { name: 'Recurrence', exact: true })).toContainText('Every 3 months');
		await page.getByPlaceholder('Item title').press('Enter');
		await expect(page.getByText('Quarterly review', { exact: true })).toBeVisible();
		const [created] = await api<Item[]>(page, `/api/lists/${listId}/items`);
		expect(created.recurrenceRule).toMatchObject({ intervalValue: 3, intervalUnit: 'MONTHS' });
		await page.goto(`/lists/${listId}/items/${created.id}`);
        await waitForHydration(page);
        await expect(page.getByPlaceholder('Item title')).toBeVisible();
		await page.reload();
		await expect(page.getByRole('combobox', { name: 'Recurrence' })).toHaveValue('Every 3 months');
		await page.getByPlaceholder('Item title').fill('Quarterly review renamed');
		await page.getByPlaceholder('Item title').press('Enter');
		await expect.poll(async () => (await api<Item>(page, `/api/lists/${listId}/items/${created.id}`)).title).toBe('Quarterly review renamed');
		expect((await api<Item>(page, `/api/lists/${listId}/items/${created.id}`)).recurrenceRule).toEqual(created.recurrenceRule);
	});

	test('persists selected weekdays and custom active-week intervals through editing and completion', async ({ page }) => {
		await createQuickItem(page, 'Monday and Thursday');
		await mode(page, 'Weekdays', true);
		await quickRecurrence(page).getByRole('checkbox', { name: 'Monday', exact: true }).focus();
        await quickRecurrence(page).getByRole('checkbox', { name: 'Monday', exact: true }).press('Space');
		await quickRecurrence(page).getByRole('checkbox', { name: 'Thursday', exact: true }).check();
		await quickRecurrence(page).getByRole('button', { name: 'Back', exact: true }).click();
		await expect(page.getByPlaceholder('Item title')).toBeFocused();
		await page.getByPlaceholder('Item title').press('Enter');
		await expect(page.getByText('Monday and Thursday', { exact: true })).toBeVisible();
		const [created] = await api<Item[]>(page, `/api/lists/${listId}/items`);
		expect(created.recurrenceRule?.weekdays).toEqual(['MONDAY', 'THURSDAY']);
		await page.goto(`/lists/${listId}/items/${created.id}`);
        await waitForHydration(page);
        await expect(page.getByPlaceholder('Item title')).toBeVisible();
		await page.reload();
		await expect(page.getByRole('combobox', { name: 'Recurrence' })).toHaveValue('Every week on Monday and Thursday');
		await mode(page, 'Custom');
		await recurrenceDialog(page).getByRole('textbox', { name: 'Repeat every' }).fill('2');
		await unit(page, 'weeks');
		await recurrenceDialog(page).getByRole('checkbox', { name: 'Monday', exact: true }).check();
		await recurrenceDialog(page).getByRole('checkbox', { name: 'Thursday', exact: true }).check();
		await recurrenceDialog(page).getByRole('button', { name: 'Close', exact: true }).click();
		await expect.poll(async () => (await api<Item>(page, `/api/lists/${listId}/items/${created.id}`)).recurrenceRule).toEqual({ intervalValue: 2, intervalUnit: 'WEEKS', weekdays: ['MONDAY', 'THURSDAY'] });
		const edited = await api<Item>(page, `/api/lists/${listId}/items/${created.id}`);
		await api(page, `/api/lists/${listId}/items/${created.id}`, 'PUT', { ...edited, dueDate: '2026-11-02' });
		await api(page, `/api/lists/${listId}/items/${created.id}/done`, 'PATCH');
		const next = (await api<Item[]>(page, `/api/lists/${listId}/items`)).filter(item => !item.done);
		expect(next).toHaveLength(1);
		expect(next[0]).toMatchObject({ dueDate: '2026-11-05', parentItemId: created.id, recurrenceRule: edited.recurrenceRule });
	});

	test('Today title edits retain weekdays and Monday Friday completion creates one next occurrence', async ({ page }) => {
		await api(page, '/api/users/me/preferences', 'PUT', { timeZone: 'UTC', todayViewEnabled: true, themePreference: 'SYSTEM' });
		const rule = { intervalValue: 1, intervalUnit: 'WEEKS', weekdays: ['MONDAY', 'FRIDAY'] };
		let current = await api<Item>(page, `/api/lists/${listId}/items`, 'POST', { title: 'Weekday sequence', dueDate: '2026-11-02', recurrenceRule: rule });
		await page.goto('/today');
		await expect(page.getByText('Weekday sequence', { exact: true })).toBeVisible();
		await page.getByText('Weekday sequence', { exact: true }).click();
		await expect(page.getByRole('combobox', { name: 'Recurrence' })).toHaveValue('Every week on Monday and Friday');
		await page.getByPlaceholder('Item title').fill('Weekday sequence renamed');
		await page.getByPlaceholder('Item title').press('Enter');
		await expect.poll(async () => (await api<Item>(page, `/api/lists/${listId}/items/${current.id}`)).title).toBe('Weekday sequence renamed');
		expect((await api<Item>(page, `/api/lists/${listId}/items/${current.id}`)).recurrenceRule).toEqual(rule);
		for (const dueDate of ['2026-11-06', '2026-11-09']) {
			const parent = current.id;
			await api(page, `/api/lists/${listId}/items/${parent}/done`, 'PATCH');
			const incomplete = (await api<Item[]>(page, `/api/lists/${listId}/items`)).filter(item => !item.done);
			expect(incomplete).toHaveLength(1);
			current = incomplete[0];
			expect(current).toMatchObject({ dueDate, parentItemId: parent, recurrenceRule: rule });
		}
	});
});

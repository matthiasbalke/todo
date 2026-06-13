import { test, expect } from '@playwright/test';
import { registerPasskey, uniqueEmail, waitForHydration } from './helpers';

test('Today preferences, count, completion, and source navigation', async ({ page, context }) => {
	await registerPasskey(page, context, 'Today User', uniqueEmail('e2e-today'));

	const setup = await page.evaluate(async () => {
		const refresh = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' }).then(r => r.json());
		const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${refresh.accessToken}` };
		const me = await fetch('/api/users/me', { headers }).then(r => r.json());
		await fetch('/api/users/me/preferences', {
			method: 'PUT', headers,
			body: JSON.stringify({ timeZone: 'UTC', todayViewEnabled: true }),
		});
		const list = await fetch('/api/lists', {
			method: 'POST', headers, body: JSON.stringify({ name: 'Today Source' }),
		}).then(r => r.json());
		const dueDate = new Date().toISOString().slice(0, 10);
		const item = await fetch(`/api/lists/${list.id}/items`, {
			method: 'POST', headers,
			body: JSON.stringify({ title: 'Today task', dueDate, assignedUserIds: [me.id] }),
		}).then(r => r.json());
		return { listId: list.id as string, itemId: item.id as string };
	});

	await page.goto('/lists');
	await waitForHydration(page);
	const todayLink = page.locator('a[href="/today"]');
	await expect(todayLink).toHaveCount(1);
	await expect(todayLink).toContainText('Today');
	await expect(todayLink).toContainText('1');
	await todayLink.click();
	await expect(page).toHaveURL(/\/today$/);
	await expect(page.getByText('Today task')).toBeVisible();
	await page.getByRole('button', { name: /Mark done/i }).click();
	await expect(page.getByText('1 checked')).toBeVisible();
	const sourceListLink = page.locator(`a[href="/lists/${setup.listId}"]`);
	await expect(sourceListLink).toHaveCount(1);
	await expect(sourceListLink).toContainText('Today Source');
	await sourceListLink.click();
	await expect(page).toHaveURL(new RegExp(`/lists/${setup.listId}$`));

	await page.goto('/account');
	await page.getByRole('button', { name: /UTC/ }).click();
	await page.getByRole('option', { name: 'Berlin (Europe)' }).click();
	await expect(page.getByText('Preferences saved.')).toBeVisible();
	await page.getByRole('switch', { name: 'Today View' }).click();
	await expect(page.getByText('Preferences saved.')).toBeVisible();
	await expect(page.getByRole('switch', { name: 'Today View' })).toHaveAttribute('aria-checked', 'false');
	await page.reload();
	await expect(page.getByRole('switch', { name: 'Today View' })).toHaveAttribute('aria-checked', 'false');
	await page.goto('/today');
	await expect(page).toHaveURL(/\/lists$/);
});

test('viewer-source Today items are read-only', async ({ page, context, browser }) => {
	const viewerEmail = uniqueEmail('e2e-today-viewer');
	await registerPasskey(page, context, 'Owner User', uniqueEmail('e2e-today-owner'));
	const listId = await page.evaluate(async () => {
		const refresh = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' }).then(r => r.json());
		const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${refresh.accessToken}` };
		const list = await fetch('/api/lists', {
			method: 'POST', headers, body: JSON.stringify({ name: 'Viewer Source' }),
		}).then(r => r.json());
		return list.id as string;
	});

	const viewerContext = await browser.newContext();
	const viewerPage = await viewerContext.newPage();
	await registerPasskey(viewerPage, viewerContext, 'Viewer User', viewerEmail);
	const viewerId = await viewerPage.evaluate(async () => {
		const refresh = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' }).then(r => r.json());
		return fetch('/api/users/me', { headers: { Authorization: `Bearer ${refresh.accessToken}` } }).then(r => r.json()).then(me => me.id as string);
	});

	await page.evaluate(async ({ listId, viewerEmail, viewerId }) => {
		const refresh = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' }).then(r => r.json());
		const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${refresh.accessToken}` };
		await fetch(`/api/lists/${listId}/members`, {
			method: 'POST', headers, body: JSON.stringify({ email: viewerEmail, role: 'VIEWER' }),
		});
		await fetch(`/api/lists/${listId}/items`, {
			method: 'POST', headers,
			body: JSON.stringify({
				title: 'Read-only Today task',
				dueDate: new Date().toISOString().slice(0, 10),
				assignedUserIds: [viewerId],
			}),
		});
	}, { listId, viewerEmail, viewerId });

	await viewerPage.goto('/today');
	await expect(viewerPage.getByText('Read-only Today task')).toBeVisible();
	await expect(viewerPage.getByRole('button', { name: /Mark done/i })).toHaveCount(0);
	await viewerContext.close();
});

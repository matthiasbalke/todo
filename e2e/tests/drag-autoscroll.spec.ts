import { test, expect, type Locator, type Page } from '@playwright/test';
import { registerPasskey, setupListWithItems, uniqueEmail, waitForHydration } from './helpers';

async function setupListWithCategories(page: Page, count: number): Promise<{ listId: string }> {
	return page.evaluate(async ({ count }) => {
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
			body: JSON.stringify({ name: 'E2E Drag Autoscroll' }),
		}).then((r) => r.json());

		for (let i = 0; i < count; i += 1) {
			await fetch(`/api/lists/${list.id}/categories`, {
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify({ name: `Category ${String(i + 1).padStart(2, '0')}`, sortOrder: i + 1 }),
			});
		}

		return { listId: list.id as string };
	}, { count });
}

async function dragHandleNearBottom(page: Page, handle: Locator, bottomY: number): Promise<void> {
	const box = await handle.boundingBox();
	if (!box) throw new Error('Missing drag handle geometry');
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width / 2, bottomY, { steps: 20 });
	await page.waitForTimeout(700);
	await page.mouse.up();
}

test.describe('Drag auto-scroll', () => {
	test.beforeEach(async ({ page, context }) => {
		await registerPasskey(page, context, 'E2E Drag User', uniqueEmail('e2e-drag-autoscroll'));
	});

	test('scrolls the page when dragging a list item near the viewport bottom', async ({ page }) => {
		const { listId } = await setupListWithItems(
			page,
			'E2E Long Manual List',
			Array.from({ length: 36 }, (_, index) => ({ title: `Manual item ${String(index + 1).padStart(2, '0')}` })),
		);
		await page.setViewportSize({ width: 390, height: 620 });
		await page.goto(`/lists/${listId}`);
		await waitForHydration(page);

		const appScroller = page.getByTestId('app-scroll-container');
		const firstHandle = page.getByLabel('Drag to reorder').first();
		const header = page.locator('header');
		const footer = page.getByTestId('fixed-action-footer');
		await expect(firstHandle).toBeVisible();
		await expect(footer).toBeVisible();
		await expect.poll(() => appScroller.evaluate((element) => element.scrollHeight)).toBeGreaterThan(620);
		await expect.poll(() => footer.evaluate((element) => {
			const rect = element.getBoundingClientRect();
			return rect.height > 0 && rect.top < window.innerHeight && rect.bottom <= window.innerHeight;
		})).toBe(true);

		await header.hover();
		const beforeHeaderWheel = await appScroller.evaluate((element) => element.scrollTop);
		await page.mouse.wheel(0, 240);
		await expect.poll(() => appScroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(beforeHeaderWheel);
		await appScroller.evaluate((element) => { element.scrollTop = 0; });
		await expect.poll(() => appScroller.evaluate((element) => element.scrollTop)).toBe(0);

		const scrollerBox = await appScroller.boundingBox();
		const headerTop = await header.evaluate((element) => element.getBoundingClientRect().top);
		const footerTop = await footer.evaluate((element) => element.getBoundingClientRect().top);
		if (!scrollerBox) throw new Error('Missing app scroller geometry');
		const before = await appScroller.evaluate((element) => element.scrollTop);
		await dragHandleNearBottom(page, firstHandle, scrollerBox.y + scrollerBox.height - 6);

		await expect.poll(() => appScroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(before);
		await expect.poll(() => page.evaluate(() => {
			const scroller = document.scrollingElement;
			return scroller ? scroller.scrollHeight <= scroller.clientHeight : true;
		})).toBe(true);
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
		await expect.poll(() => header.evaluate((element) => element.getBoundingClientRect().top)).toBe(headerTop);
		await expect.poll(() => footer.evaluate((element) => element.getBoundingClientRect().top)).toBe(footerTop);
	});

	test('scrolls the category dialog body instead of the page while dragging a category row', async ({ page }) => {
		const { listId } = await setupListWithCategories(page, 28);
		await page.setViewportSize({ width: 390, height: 620 });
		await page.goto(`/lists/${listId}`);
		await waitForHydration(page);
		await page.getByRole('button', { name: 'List options' }).click();
		await page.getByRole('button', { name: 'Configure categories' }).click();

		const dialog = page.getByRole('dialog', { name: 'Categories' });
		await expect(dialog).toBeVisible();
		const appScroller = page.getByTestId('app-scroll-container');
		const zone = page.getByTestId('category-reorder-zone');
		const scrollBody = zone.locator('xpath=parent::*');
		const handle = dialog.locator('[aria-label="Drag to reorder category"]').first();
		await expect(handle).toBeVisible();

		const bodyBox = await scrollBody.boundingBox();
		if (!bodyBox) throw new Error('Missing category dialog scroll body geometry');
		const beforeDialog = await scrollBody.evaluate((element) => element.scrollTop);
		const beforePage = await appScroller.evaluate((element) => element.scrollTop);

		await dragHandleNearBottom(page, handle, bodyBox.y + bodyBox.height - 6);

		await expect.poll(() => scrollBody.evaluate((element) => element.scrollTop)).toBeGreaterThan(beforeDialog);
		await expect.poll(() => appScroller.evaluate((element) => element.scrollTop)).toBe(beforePage);
	});
});

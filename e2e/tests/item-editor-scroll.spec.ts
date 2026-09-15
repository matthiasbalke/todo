import { test, expect, type Locator } from '@playwright/test';
import { registerPasskey, setupListWithCategoriesAndItems, uniqueEmail, waitForHydration } from './helpers';

async function expectAligned(control: Locator) {
	await expect.poll(() => control.evaluate((element) => {
		const row = element.closest('[data-item-edit-field]')!;
		return Math.abs(row.getBoundingClientRect().top - (window.visualViewport?.offsetTop ?? 0) - 96);
	})).toBeLessThanOrEqual(2);
}

// Resizing tests exercise browser geometry, not a native software keyboard.
test.describe('Item editor scrolling', () => {
	test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
	test.beforeEach(async ({ page, context }) => {
		await registerPasskey(page, context, 'Scroll User', uniqueEmail('editor-scroll'));
		const { listId, itemIds } = await setupListWithCategoriesAndItems(page, 'Scroll List',
			Array.from({ length: 25 }, (_, i) => `Category ${String(i).padStart(2, '0')}`), [{ title: 'Short item' }]);
		await page.goto(`/lists/${listId}/items/${itemIds[0]}`);
		await waitForHydration(page);
		await expect(page.getByRole('textbox', { name: 'Item title' })).toHaveValue('Short item');
	});

	test('aligns after mouse release, touch and keyboard activation, retaining short-page space', async ({ page }) => {
		await expectAligned(page.getByRole('textbox', { name: 'Item title' }));
		const assignees = page.getByRole('combobox', { name: 'Assignees' });
		const bounds = await assignees.boundingBox();
		expect(bounds).not.toBeNull();
		await page.mouse.move(bounds!.x + 10, bounds!.y + 10);
		const before = await page.evaluate(() => window.scrollY);
		await page.mouse.down();
		await page.evaluate(() => new Promise(requestAnimationFrame));
		expect(await page.evaluate(() => window.scrollY)).toBe(before);
		await page.mouse.up();
		await expectAligned(assignees);
		const spacer = page.getByTestId('item-editor-scroll-space');
		const reserved = await spacer.evaluate((element) => element.getBoundingClientRect().height);
		expect(reserved).toBeGreaterThan(0);
		await page.setViewportSize({ width: 390, height: 360 });
		await expectAligned(assignees);
		await page.setViewportSize({ width: 390, height: 844 });
		await expectAligned(assignees);
		expect(await spacer.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(reserved);
		await assignees.press('Escape');
		await page.getByRole('textbox', { name: 'Item title' }).tap();
		await expectAligned(page.getByRole('textbox', { name: 'Item title' }));
		// The star toggle sits between the title and category in tab order.
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await expect(page.getByRole('combobox', { name: 'Category' })).toBeFocused();
		await expectAligned(page.getByRole('combobox', { name: 'Category' }));
		await page.mouse.wheel(0, 120);
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
		const manual = await page.evaluate(() => window.scrollY);
		await page.evaluate(() => window.visualViewport?.dispatchEvent(new Event('resize')));
		await page.evaluate(() => new Promise(requestAnimationFrame));
		expect(await page.evaluate(() => window.scrollY)).toBe(manual);
		await page.getByRole('combobox', { name: 'Category' }).tap();
		await expectAligned(page.getByRole('combobox', { name: 'Category' }));
	});

	test('long options and calendar navigation scroll their panels without moving the document', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 360 });
		const category = page.getByRole('combobox', { name: 'Category' });
		await category.click();
		await expectAligned(category);
		const before = await page.evaluate(() => window.scrollY);
		await category.press('End');
		const listbox = page.getByRole('listbox');
		await expect.poll(() => listbox.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
		expect(await page.evaluate(() => window.scrollY)).toBe(before);
		expect(await listbox.evaluate((element) => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(352);
		const menuBounds = await listbox.boundingBox();
		await page.mouse.move(menuBounds!.x + 10, menuBounds!.y + 10);
		const menuScroll = await listbox.evaluate((element) => element.scrollTop);
		await page.mouse.wheel(0, -100);
		await expect.poll(() => listbox.evaluate((element) => element.scrollTop)).toBeLessThan(menuScroll);
		expect(await page.evaluate(() => window.scrollY)).toBe(before);
		await category.press('End');
		await category.press('Enter');
		await expect(category).toHaveValue('Category 24');
		const date = page.getByRole('button', { name: 'Due Date' });
		await date.click();
		await expectAligned(date);
		const dateScroll = await page.evaluate(() => window.scrollY);
		await page.keyboard.press('PageDown');
		await page.keyboard.press('End');
		const calendar = page.getByRole('dialog', { name: 'Calendar', exact: true });
		expect(await calendar.evaluate((element) => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(352);
		expect(await page.evaluate(() => window.scrollY)).toBe(dateScroll);
		const focused = await page.locator(':focus').boundingBox();
		const panel = await calendar.boundingBox();
		expect(focused!.y).toBeGreaterThanOrEqual(panel!.y);
		expect(focused!.y + focused!.height).toBeLessThanOrEqual(panel!.y + panel!.height);
		await page.keyboard.press('Escape');
		await expect(date).toBeFocused();
		expect(await page.evaluate(() => window.scrollY)).toBe(dateScroll);
	});

	test('notes retain visible chrome and restore focus and document position after Save and Cancel', async ({ page }) => {
		await page.getByRole('combobox', { name: 'Assignees' }).tap();
		await expectAligned(page.getByRole('combobox', { name: 'Assignees' }));
		await page.keyboard.press('Escape');
		const trigger = page.getByRole('button', { name: 'Notes', exact: true });
		const before = await page.evaluate(() => window.scrollY);
		await trigger.click();
		const dialog = page.getByRole('dialog', { name: 'Notes', exact: true });
		const textarea = dialog.getByRole('textbox', { name: 'Notes' });
		const longNotes = 'Line of long notes\n'.repeat(150);
		await textarea.fill(longNotes);
		await page.setViewportSize({ width: 390, height: 360 });
		await expect.poll(() => dialog.evaluate((element) => element.getBoundingClientRect().height)).toBe(360);
		await textarea.press('ControlOrMeta+End');
		await expect.poll(() => textarea.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
		for (const name of ['Save', 'Cancel']) {
			const bounds = await dialog.getByRole('button', { name }).boundingBox();
			expect(bounds!.y).toBeGreaterThanOrEqual(0);
			expect(bounds!.y + bounds!.height).toBeLessThan(360);
		}
		expect(await textarea.evaluate((element) => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(360);
		await page.setViewportSize({ width: 390, height: 844 });
		await dialog.getByRole('button', { name: 'Save' }).click();
		await expect(dialog).not.toBeVisible();
		await expect(trigger).toBeFocused();
		expect(await page.evaluate(() => window.scrollY)).toBe(before);
		await trigger.click();
		await expect(textarea).toHaveValue(longNotes);
		await textarea.fill('Discarded');
		await dialog.getByRole('button', { name: 'Cancel' }).click();
		await expect(trigger).toBeFocused();
		expect(await page.evaluate(() => window.scrollY)).toBe(before);
		expect(await page.evaluate(() => document.body.style.position)).toBe('');
	});

	for (const returnToTitle of [false, true]) {
		test(`slow saves preserve ${returnToTitle ? 'a later title session' : 'the next field'}`, async ({ page }) => {
			let release!: () => void;
			const gate = new Promise<void>((resolve) => { release = resolve; });
			await page.route('**/api/lists/*/items/*', async (route) => {
				if (route.request().method() === 'PUT') await gate;
				await route.continue();
			});
			const title = page.getByRole('textbox', { name: 'Item title' });
			await title.fill('Saved slowly');
			const request = page.waitForRequest((request) => request.method() === 'PUT' && request.url().includes('/items/'));
			await title.press('Enter');
			await request;
			const category = page.getByRole('combobox', { name: 'Category' });
			await category.click();
			if (returnToTitle) await title.click();
			const response = page.waitForResponse((response) => response.request().method() === 'PUT' && response.url().includes('/items/'));
			release();
			await response;
			await page.evaluate(() => new Promise(requestAnimationFrame));
			await expect(returnToTitle ? title : category).toBeFocused();
		});
	}
});

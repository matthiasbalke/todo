import { expect, test } from '@playwright/test';
import { registerPasskey, uniqueEmail, waitForHydration } from './helpers';

test('startup loading screen uses cached dark theme before session preferences load', async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.setItem('todo_theme_preference', 'DARK');
	});
	await page.route('**/actuator/health', async route => {
		await route.fulfill({
			status: 503,
			contentType: 'application/json',
			body: JSON.stringify({ status: 'DOWN' }),
		});
	});

	await page.goto('/');

	await expect(page.getByText(/Application is starting/)).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
	await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#111827');
});

test('theme selection persists and applies without reload', async ({ page, context }) => {
	await registerPasskey(page, context, 'Theme User', uniqueEmail('e2e-theme'));

	await page.goto('/account');
	await waitForHydration(page);
	await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue('System');

	await page.getByRole('combobox', { name: 'Theme' }).click();
	await page.getByRole('option', { name: 'Dark' }).click();
	await expect(page.getByText('Preferences saved.')).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#111827');

	await page.reload();
	await waitForHydration(page);
	await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue('Dark');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

	await page.getByRole('combobox', { name: 'Theme' }).click();
	await page.getByRole('option', { name: 'Light' }).click();
	await expect(page.getByText('Preferences saved.')).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f9fafb');
});

test('system theme follows browser color scheme until explicit preference is saved', async ({ page, context }) => {
	await page.emulateMedia({ colorScheme: 'dark' });
	await registerPasskey(page, context, 'System Theme User', uniqueEmail('e2e-theme-system'));

	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await page.goto('/account');
	await waitForHydration(page);
	await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue('System');

	await page.emulateMedia({ colorScheme: 'light' });
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

	await page.getByRole('combobox', { name: 'Theme' }).click();
	await page.getByRole('option', { name: 'Dark' }).click();
	await expect(page.getByText('Preferences saved.')).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

	await page.emulateMedia({ colorScheme: 'light' });
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

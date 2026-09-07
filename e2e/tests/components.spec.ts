import { expect, test } from '@playwright/test';
import { waitForHydration } from './helpers';

test.describe('Component showcase controls', () => {
	test('basic Select filters and selects predefined options', async ({ page }) => {
		await page.goto('/components');
		await waitForHydration(page);

		const section = page
			.getByRole('heading', { name: 'Select Component' })
			.locator('xpath=ancestor::section[1]');
		const select = section.getByRole('combobox', { name: 'Choose a Fruit' });

		await select.fill('ban');
		await expect(section.getByRole('option', { name: 'Banana' })).toBeVisible();
		await section.getByRole('option', { name: 'Banana' }).click();

		await expect(select).toHaveValue('Banana');
		await expect(section.getByText('Selected: Banana')).toBeVisible();
	});

	test('MemberInviteEmailInput exposes suggestions and accepts arbitrary email text', async ({
		page
	}) => {
		await page.goto('/components');
		await waitForHydration(page);

		const section = page
			.getByRole('heading', { name: 'MemberInviteEmailInput Component' })
			.locator('xpath=ancestor::section[1]');
		const inviteInput = section.getByRole('combobox', { name: 'Invite member' });

		await inviteInput.fill('casey');
		await expect(section.getByRole('option', { name: /Casey Stone/ })).toBeVisible();
		await section.getByRole('option', { name: /Casey Stone/ }).click();
		await expect(inviteInput).toHaveValue('casey@example.com');

		await inviteInput.fill('outside@example.com');
		await expect(inviteInput).toHaveValue('outside@example.com');
		await expect(section.getByText('Value: outside@example.com')).toBeVisible();

		await expect(section.getByRole('combobox', { name: 'Invite unsuggested account' })).toHaveValue(
			'outside@example.com'
		);
	});
});

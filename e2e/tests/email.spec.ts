import { expect, test, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { waitForHydration, uniqueEmail } from './helpers';

const adminStorageState = '.auth/admin.json';
const mailpitHost = process.env.MAILPIT_HOST ?? localMailpitHost();
const starttlsMailpitApiUrl = process.env.MAILPIT_STARTTLS_API_URL ?? mailpitApiUrl(mailpitHost, 8025);
const smtpsMailpitApiUrl = process.env.MAILPIT_SMTPS_API_URL ?? mailpitApiUrl(mailpitHost, 8026);
const mailpitE2eAvailable = Boolean(starttlsMailpitApiUrl && smtpsMailpitApiUrl) && existsSync(adminStorageState);
const starttlsSmtpHost = process.env.MAILPIT_STARTTLS_SMTP_HOST ?? mailpitHost ?? 'mailpit-starttls';
const starttlsSmtpPort = Number(process.env.MAILPIT_STARTTLS_SMTP_PORT ?? '1025');
const smtpsSmtpHost = process.env.MAILPIT_SMTPS_SMTP_HOST ?? mailpitHost ?? 'mailpit-smtps';
const smtpsSmtpPort = Number(process.env.MAILPIT_SMTPS_SMTP_PORT ?? '1465');
const testSubject = 'Todo email settings test';
const testBody = 'This is a test message from Todo. If you received it, outbound email delivery is configured.';

test.use({ storageState: adminStorageState });

type MailpitAddress = {
	Name?: string;
	Address?: string;
	name?: string;
	address?: string;
};

type MailpitMessageSummary = {
	ID?: string;
	id?: string;
	From?: MailpitAddress;
	from?: MailpitAddress;
	To?: MailpitAddress[];
	to?: MailpitAddress[];
	Subject?: string;
	subject?: string;
	Snippet?: string;
	snippet?: string;
};

function localMailpitHost(): string | undefined {
	if (process.env.LOCAL_HTTPS_DOMAIN) {
		return process.env.LOCAL_HTTPS_DOMAIN;
	}
	if (process.env.BASE_URL) {
		return new URL(process.env.BASE_URL).hostname;
	}
	if (existsSync('../.local-domain')) {
		return readFileSync('../.local-domain', 'utf8').trim();
	}
	return undefined;
}

function mailpitApiUrl(host: string | undefined, port: number): string | undefined {
	return host ? `http://${host}:${port}` : undefined;
}

async function clearMailpit(apiUrl: string) {
	await fetch(`${apiUrl}/api/v1/messages`, { method: 'DELETE' });
}

async function pollMailpitMessage(apiUrl: string, recipient: string): Promise<{ summary: MailpitMessageSummary; raw: string }> {
	for (let attempt = 0; attempt < 20; attempt += 1) {
		const response = await fetch(`${apiUrl}/api/v1/messages?limit=50`);
		expect(response.ok).toBe(true);
		const body = await response.json() as { messages?: MailpitMessageSummary[]; Messages?: MailpitMessageSummary[] };
		const messages = body.messages ?? body.Messages ?? [];
		const summary = messages.find((message) => addresses(message.To ?? message.to).includes(recipient));
		if (summary) {
			const id = summary.ID ?? summary.id;
			expect(id).toBeTruthy();
			const rawResponse = await fetch(`${apiUrl}/api/v1/message/${id}/raw`);
			expect(rawResponse.ok).toBe(true);
			return { summary, raw: await rawResponse.text() };
		}
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
	throw new Error(`Mailpit did not capture a message for ${recipient}`);
}

function addresses(value: MailpitAddress[] | undefined): string[] {
	return (value ?? []).map((address) => address.Address ?? address.address ?? '').filter(Boolean);
}

function address(value: MailpitAddress | undefined): string {
	return value?.Address ?? value?.address ?? '';
}

async function ensureSwitch(page: Page, name: string, checked: boolean) {
	const control = page.getByRole('switch', { name });
	if ((await control.getAttribute('aria-checked')) !== String(checked)) {
		await control.click();
	}
}

async function chooseEncryption(page: Page, label: 'STARTTLS' | 'SSL/TLS') {
	const encryption = page.getByRole('combobox', { name: 'Encryption' });
	await encryption.click();
	await page.getByRole('option', { name: label }).click();
}

async function configureEmail(page: Page, settings: {
	host: string;
	port: number;
	encryption: 'STARTTLS' | 'SSL/TLS';
	from: string;
	fromName: string;
}) {
	await page.goto('/admin/settings');
	await waitForHydration(page);
	await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();

	await ensureSwitch(page, 'Email delivery enabled', true);
	await ensureSwitch(page, 'SMTP authentication enabled', false);
	await page.getByLabel('SMTP host').fill(settings.host);
	await chooseEncryption(page, settings.encryption);
	await page.getByLabel('SMTP port').fill(String(settings.port));
	await page.getByLabel('Sender email').fill(settings.from);
	await page.getByLabel('Sender name').fill(settings.fromName);
	const saveButton = page.getByRole('button', { name: 'Save' });
	if (await saveButton.isEnabled()) {
		const saveResponse = page.waitForResponse((response) =>
			response.url().includes('/api/admin/settings/email')
			&& response.request().method() === 'PATCH',
			{ timeout: 15000 },
		);
		await saveButton.click();
		const response = await saveResponse;
		expect(response.ok(), `Email settings save returned ${response.status()}`).toBe(true);
		await expect(page.getByRole('button', { name: 'Test' })).toBeEnabled();
	}
}

async function sendTestEmail(page: Page, recipient: string) {
	await page.getByLabel('Test recipient').fill(recipient);
	const testResponse = page.waitForResponse((response) =>
		response.url().includes('/api/admin/settings/email/test')
		&& response.request().method() === 'POST',
		{ timeout: 30000 },
	);
	await page.getByRole('button', { name: 'Test' }).click();
	const response = await testResponse;
	expect(response.ok(), `Test email endpoint returned ${response.status()}`).toBe(true);
	await expect(page.getByText('Test email accepted for delivery.')).toBeVisible({ timeout: 15000 });
}

function expectCapturedTestMessage(
	captured: { summary: MailpitMessageSummary; raw: string },
	expected: { recipient: string; from: string },
) {
	expect(captured.summary.Subject ?? captured.summary.subject).toBe(testSubject);
	expect(address(captured.summary.From ?? captured.summary.from)).toBe(expected.from);
	expect(addresses(captured.summary.To ?? captured.summary.to)).toContain(expected.recipient);
	expect(captured.raw).toContain(`To: ${expected.recipient}`);
	expect(captured.raw).toContain(`Subject: ${testSubject}`);
	expect(captured.raw).toContain(testBody);
}

test.describe('admin email delivery settings', () => {
	test.describe.configure({ mode: 'serial' });
	test.skip(!mailpitE2eAvailable, 'Mailpit email E2E requires MAILPIT_* API URLs and setup-created admin storage state.');

	test.afterEach(async ({ context }) => {
		const cookies = await context.cookies();
		if (cookies.some((cookie) => cookie.name === 'refreshToken')) {
			await context.storageState({ path: adminStorageState });
		}
	});

	test('sends a fixed test email through STARTTLS Mailpit', async ({ page }) => {
		const mailpitApi = starttlsMailpitApiUrl!;
		const recipient = uniqueEmail('e2e-starttls');
		const from = 'todo-starttls@example.com';
		await clearMailpit(mailpitApi);

		await configureEmail(page, {
			host: starttlsSmtpHost,
			port: starttlsSmtpPort,
			encryption: 'STARTTLS',
			from,
			fromName: 'Todo E2E',
		});
		await sendTestEmail(page, recipient);

		expectCapturedTestMessage(await pollMailpitMessage(mailpitApi, recipient), { recipient, from });
	});

	test('sends a fixed test email through SSL/TLS Mailpit', async ({ page }) => {
		const mailpitApi = smtpsMailpitApiUrl!;
		const recipient = uniqueEmail('e2e-smtps');
		const from = 'todo-smtps@example.com';
		await clearMailpit(mailpitApi);

		await configureEmail(page, {
			host: smtpsSmtpHost,
			port: smtpsSmtpPort,
			encryption: 'SSL/TLS',
			from,
			fromName: 'Todo E2E',
		});
		await sendTestEmail(page, recipient);

		expectCapturedTestMessage(await pollMailpitMessage(mailpitApi, recipient), { recipient, from });
	});
});

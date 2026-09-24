/**
 * Shared E2E test helpers for lists.spec.ts and items.spec.ts.
 */
import type { BrowserContext, CDPSession, Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

type MailpitAddress = {
	Address?: string;
	address?: string;
};

type MailpitMessageSummary = {
	ID?: string;
	id?: string;
	To?: MailpitAddress[];
	to?: MailpitAddress[];
};

export async function addVirtualAuthenticator(cdp: CDPSession): Promise<string> {
	await cdp.send('WebAuthn.enable', { enableUI: false });
	const { authenticatorId } = (await cdp.send('WebAuthn.addVirtualAuthenticator', {
		options: {
			protocol: 'ctap2',
			transport: 'internal',
			hasResidentKey: true,
			hasUserVerification: true,
			isUserVerified: true,
		},
	})) as { authenticatorId: string };
	return authenticatorId;
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
): Promise<string> {
	await page.goto('/auth');
	await waitForHydration(page);

	const cdp = await context.newCDPSession(page);
	const authenticatorId = await addVirtualAuthenticator(cdp);

	await page.getByRole('button', { name: 'Create account' }).click();
	await page.getByPlaceholder('Your name').fill(displayName);
	await page.getByPlaceholder('you@example.com').fill(email);
	await page.getByRole('button', { name: /Register passkey/ }).click();

	await page.waitForURL('**/verify-email');
	await completeEmailVerification(page, email);
	await page.waitForURL('**/lists');
	return authenticatorId;
}

export async function completeEmailVerification(page: Page, email: string): Promise<void> {
	const sendButton = page.getByRole('button', { name: 'Send verification email' });
	if (await sendButton.isVisible().catch(() => false)) {
		await sendButton.click();
	}
	const token = await pollVerificationToken(email);
	await page.getByLabel('Verification token').fill(token);
	await page.getByRole('button', { name: 'Verify' }).click();
	await page.getByRole('button', { name: 'Continue' }).click();
}

async function pollVerificationToken(recipient: string): Promise<string> {
	const apiUrls = mailpitApiUrls();
	if (apiUrls.length === 0) {
		throw new Error('Email verification E2E requires Mailpit. Set MAILPIT_STARTTLS_API_URL or MAILPIT_SMTPS_API_URL, or configure .local-domain so the default Mailpit URLs can be derived.');
	}
	for (let attempt = 0; attempt < 30; attempt += 1) {
		for (const apiUrl of apiUrls) {
			const token = await findVerificationToken(apiUrl, recipient);
			if (token) return token;
		}
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
	throw new Error(`Mailpit did not capture a verification email for ${recipient}`);
}

async function findVerificationToken(apiUrl: string, recipient: string): Promise<string | null> {
	const response = await fetch(`${apiUrl}/api/v1/messages?limit=50`).catch(() => null);
	if (!response?.ok) return null;
	const body = await response.json() as { messages?: MailpitMessageSummary[]; Messages?: MailpitMessageSummary[] };
	const messages = body.messages ?? body.Messages ?? [];
	const summary = messages.find((message) => addresses(message.To ?? message.to).includes(recipient));
	if (!summary) return null;
	const id = summary.ID ?? summary.id;
	if (!id) return null;
	const rawResponse = await fetch(`${apiUrl}/api/v1/message/${id}/raw`).catch(() => null);
	if (!rawResponse?.ok) return null;
	const raw = await rawResponse.text();
	return raw.match(/validation_token=([A-Za-z0-9_-]+)/)?.[1] ?? null;
}

function addresses(value: MailpitAddress[] | undefined): string[] {
	return (value ?? []).map((address) => address.Address ?? address.address ?? '').filter(Boolean);
}

function mailpitApiUrls(): string[] {
	const urls = [
		process.env.MAILPIT_STARTTLS_API_URL,
		process.env.MAILPIT_SMTPS_API_URL,
		defaultMailpitApiUrl(8025),
		defaultMailpitApiUrl(8026),
	].filter((value): value is string => Boolean(value));
	return Array.from(new Set(urls));
}

function defaultMailpitApiUrl(port: number): string | undefined {
	const host = process.env.MAILPIT_HOST ?? localMailpitHost();
	return host ? `http://${host}:${port}` : undefined;
}

function localMailpitHost(): string | undefined {
	if (process.env.LOCAL_HTTPS_DOMAIN) return process.env.LOCAL_HTTPS_DOMAIN;
	if (process.env.BASE_URL) return new URL(process.env.BASE_URL).hostname;
	if (existsSync('../.local-domain')) return readFileSync('../.local-domain', 'utf8').trim();
	return undefined;
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

import { describe, expect, it, vi } from 'vitest';

vi.mock('./authedClient', () => ({
	authedFetch: vi.fn(),
}));

import { authedFetch } from './authedClient';
import { resetEmailSettings, testEmailSettings, updateEmailSettings, updatePublicBaseUrl } from './admin';

describe('admin api', () => {
	it('updateEmailSettings sends the full email settings payload', async () => {
		const req = {
			enabled: true,
			authEnabled: true,
			host: 'smtp.example.com',
			port: 587,
			protocol: 'smtp',
			encryption: 'STARTTLS' as const,
			username: 'mailer',
			passwordAction: 'REPLACE' as const,
			password: 'secret',
			from: 'todo@example.com',
			fromName: 'Todo',
			publicBaseUrl: 'https://todo.example.com',
		};

		await updateEmailSettings(req);

		expect(authedFetch).toHaveBeenCalledWith('/api/admin/settings/email', {
			method: 'PATCH',
			body: JSON.stringify(req),
		});
	});

	it('resetEmailSettings posts to the reset endpoint', async () => {
		await resetEmailSettings();

		expect(authedFetch).toHaveBeenCalledWith('/api/admin/settings/email/reset', { method: 'POST' });
	});

	it('updatePublicBaseUrl patches the public app URL endpoint', async () => {
		await updatePublicBaseUrl('https://todo.example.com');

		expect(authedFetch).toHaveBeenCalledWith('/api/admin/settings/public-base-url', {
			method: 'PATCH',
			body: JSON.stringify({ publicBaseUrl: 'https://todo.example.com' }),
		});
	});

	it('testEmailSettings posts the recipient', async () => {
		await testEmailSettings('recipient@example.com');

		expect(authedFetch).toHaveBeenCalledWith('/api/admin/settings/email/test', {
			method: 'POST',
			body: JSON.stringify({ recipient: 'recipient@example.com' }),
		});
	});
});

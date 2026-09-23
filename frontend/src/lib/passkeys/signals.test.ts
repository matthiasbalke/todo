import { afterEach, describe, expect, it, vi } from 'vitest';
import { signalCurrentUserDetails } from './signals';

const writableGlobal = globalThis as Record<string, unknown>;
const originalPublicKeyCredential = writableGlobal.PublicKeyCredential;

const user = {
	id: '00000000-0000-0000-0000-000000000001',
	email: 'new@example.com',
	displayName: 'New Name',
};

describe('signalCurrentUserDetails', () => {
	afterEach(() => {
		if (originalPublicKeyCredential === undefined) {
			Reflect.deleteProperty(writableGlobal, 'PublicKeyCredential');
		} else {
			writableGlobal.PublicKeyCredential = originalPublicKeyCredential;
		}
		vi.restoreAllMocks();
	});

	it('does nothing when the browser does not support the signal', async () => {
		Reflect.deleteProperty(writableGlobal, 'PublicKeyCredential');

		await expect(signalCurrentUserDetails(user)).resolves.toBeUndefined();
	});

	it('signals updated account details with the WebAuthn user handle', async () => {
		const signal = vi.fn().mockResolvedValue(undefined);
		writableGlobal.PublicKeyCredential = { signalCurrentUserDetails: signal };

		await signalCurrentUserDetails(user);

		expect(signal).toHaveBeenCalledWith({
			rpId: window.location.hostname,
			userId: 'AAAAAAAAAAAAAAAAAAAAAQ',
			name: 'new@example.com',
			displayName: 'New Name',
		});
	});

	it('swallows browser or authenticator signal failures', async () => {
		writableGlobal.PublicKeyCredential = {
			signalCurrentUserDetails: vi.fn().mockRejectedValue(new Error('unsupported')),
		};

		await expect(signalCurrentUserDetails(user)).resolves.toBeUndefined();
	});
});

export interface PasskeyUserDetails {
	id: string;
	email: string;
	displayName: string;
}

type PublicKeyCredentialWithSignals = typeof PublicKeyCredential & {
	signalCurrentUserDetails?: (options: {
		rpId: string;
		userId: string;
		name: string;
		displayName: string;
	}) => Promise<void>;
};

function uuidToBase64Url(uuid: string): string {
	const hex = uuid.replaceAll('-', '');
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i += 1) {
		bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function signalCurrentUserDetails(user: PasskeyUserDetails): Promise<void> {
	if (typeof window === 'undefined' || typeof PublicKeyCredential === 'undefined') return;
	const signal = (PublicKeyCredential as PublicKeyCredentialWithSignals).signalCurrentUserDetails;
	if (!signal) return;
	try {
		await signal({
			rpId: window.location.hostname,
			userId: uuidToBase64Url(user.id),
			name: user.email,
			displayName: user.displayName,
		});
	} catch {
		// Browser/authenticator support is best-effort; account updates must not depend on it.
	}
}

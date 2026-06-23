import { authedFetch } from './authedClient';

export interface VapidPublicKeyResponse {
	publicKey: string;
}

export interface SubscribeRequest {
	endpoint: string;
	p256dh: string;
	auth: string;
}

export interface UnsubscribeRequest {
	endpoint: string;
}

export async function getVapidPublicKey(): Promise<VapidPublicKeyResponse> {
	const res = await fetch('/api/push/vapid-public-key');
	if (!res.ok) throw new Error('Failed to fetch VAPID public key');
	return res.json();
}

export async function subscribePush(req: SubscribeRequest): Promise<void> {
	return authedFetch('/api/push/subscribe', {
		method: 'POST',
		body: JSON.stringify(req),
	});
}

export async function unsubscribePush(req: UnsubscribeRequest): Promise<void> {
	return authedFetch('/api/push/subscribe', {
		method: 'DELETE',
		body: JSON.stringify(req),
	});
}

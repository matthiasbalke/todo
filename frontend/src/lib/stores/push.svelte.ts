import { getVapidPublicKey, subscribePush, unsubscribePush } from '$lib/api/push';

export type PushState = 'unsupported' | 'prompt' | 'denied' | 'subscribed';

let pushState = $state<PushState>('unsupported');

export function getPushState(): PushState {
	return pushState;
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	const buffer = new ArrayBuffer(rawData.length);
	const uint8 = new Uint8Array(buffer);
	for (let i = 0; i < rawData.length; i++) {
		uint8[i] = rawData.charCodeAt(i);
	}
	return uint8;
}

export async function initPushState(): Promise<void> {
	if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !(window as typeof window & { PushManager?: unknown }).PushManager) {
		pushState = 'unsupported';
		return;
	}

	const permission = window.Notification?.permission;
	if (permission === 'denied') {
		pushState = 'denied';
		return;
	}

	const registration = await navigator.serviceWorker.ready;
	const existingSubscription = await registration.pushManager.getSubscription();
	if (existingSubscription) {
		pushState = 'subscribed';
	} else {
		pushState = 'prompt';
	}
}

export async function requestPushSubscription(): Promise<void> {
	const registration = await navigator.serviceWorker.ready;
	const { publicKey } = await getVapidPublicKey();
	let subscription: PushSubscription;
	try {
		subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(publicKey),
		});
	} catch (e) {
		if (e instanceof DOMException && e.name === 'NotAllowedError') {
			pushState = 'denied';
			return;
		}
		throw e;
	}
	const json = subscription.toJSON();
	await subscribePush({
		endpoint: subscription.endpoint,
		p256dh: json.keys?.['p256dh'] ?? '',
		auth: json.keys?.['auth'] ?? '',
	});
	pushState = 'subscribed';
}

export async function revokePushSubscription(): Promise<void> {
	const registration = await navigator.serviceWorker.ready;
	const subscription = await registration.pushManager.getSubscription();
	if (!subscription) {
		pushState = 'prompt';
		return;
	}
	await unsubscribePush({ endpoint: subscription.endpoint });
	await subscription.unsubscribe();
	pushState = 'prompt';
}

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetVapidPublicKey = vi.fn();
const mockSubscribePush = vi.fn();
const mockUnsubscribePush = vi.fn();

vi.mock('$lib/api/push', () => ({
	getVapidPublicKey: mockGetVapidPublicKey,
	subscribePush: mockSubscribePush,
	unsubscribePush: mockUnsubscribePush,
}));

function mockNotification(permission: NotificationPermission) {
	Object.defineProperty(window, 'Notification', {
		value: { permission },
		writable: true,
		configurable: true,
	});
}

function mockPushManager(value: unknown) {
	Object.defineProperty(window, 'PushManager', {
		value,
		writable: true,
		configurable: true,
	});
}

function mockServiceWorker(pushManager: unknown) {
	Object.defineProperty(navigator, 'serviceWorker', {
		value: {
			ready: Promise.resolve({ pushManager }),
		},
		writable: true,
		configurable: true,
	});
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.resetModules();
	mockPushManager(undefined);
	// Reset serviceWorker to a safe default before each test
	mockServiceWorker({ getSubscription: vi.fn().mockResolvedValue(null) });
});

async function getStore() {
	return import('$lib/stores/push.svelte');
}

describe('initPushState', () => {
	it('returns unsupported when PushManager is not available', async () => {
		mockPushManager(undefined);
		const { initPushState, getPushState } = await getStore();
		await initPushState();
		expect(getPushState()).toBe('unsupported');
	});

	it('returns denied when Notification.permission is denied', async () => {
		mockPushManager({});
		mockNotification('denied');
		const { initPushState, getPushState } = await getStore();
		await initPushState();
		expect(getPushState()).toBe('denied');
	});

	it('returns subscribed when existing subscription is found', async () => {
		mockPushManager({});
		mockNotification('default');
		const mockSub = { endpoint: 'https://example.com/push' };
		mockServiceWorker({ getSubscription: vi.fn().mockResolvedValue(mockSub) });

		const { initPushState, getPushState } = await getStore();
		await initPushState();
		expect(getPushState()).toBe('subscribed');
	});

	it('returns prompt when no existing subscription', async () => {
		mockPushManager({});
		mockNotification('default');
		mockServiceWorker({ getSubscription: vi.fn().mockResolvedValue(null) });

		const { initPushState, getPushState } = await getStore();
		await initPushState();
		expect(getPushState()).toBe('prompt');
	});
});

describe('requestPushSubscription', () => {
	it('subscribes and transitions to subscribed state', async () => {
		mockGetVapidPublicKey.mockResolvedValue({ publicKey: 'dGVzdA==' });
		mockSubscribePush.mockResolvedValue(undefined);

		const mockSubscription = {
			endpoint: 'https://example.com/push',
			toJSON: () => ({ keys: { p256dh: 'key', auth: 'auth' } }),
		};
		mockServiceWorker({ subscribe: vi.fn().mockResolvedValue(mockSubscription) });

		const { requestPushSubscription, getPushState } = await getStore();
		await requestPushSubscription();

		expect(mockSubscribePush).toHaveBeenCalledWith({
			endpoint: 'https://example.com/push',
			p256dh: 'key',
			auth: 'auth',
		});
		expect(getPushState()).toBe('subscribed');
	});

	it('sets state to denied without throwing when permission is denied', async () => {
		mockPushManager({});
		mockGetVapidPublicKey.mockResolvedValue({ publicKey: 'dGVzdA==' });

		const notAllowedError = new DOMException('Permission denied', 'NotAllowedError');
		mockServiceWorker({ subscribe: vi.fn().mockRejectedValue(notAllowedError) });

		const { requestPushSubscription, getPushState } = await getStore();

		await expect(requestPushSubscription()).resolves.toBeUndefined();
		expect(getPushState()).toBe('denied');
	});
});

describe('revokePushSubscription', () => {
	it('unsubscribes and transitions to prompt state', async () => {
		mockUnsubscribePush.mockResolvedValue(undefined);

		const mockSubscription = {
			endpoint: 'https://example.com/push',
			unsubscribe: vi.fn().mockResolvedValue(true),
		};
		mockServiceWorker({ getSubscription: vi.fn().mockResolvedValue(mockSubscription) });

		const { revokePushSubscription, getPushState } = await getStore();
		await revokePushSubscription();

		expect(mockUnsubscribePush).toHaveBeenCalledWith({ endpoint: 'https://example.com/push' });
		expect(getPushState()).toBe('prompt');
	});
});

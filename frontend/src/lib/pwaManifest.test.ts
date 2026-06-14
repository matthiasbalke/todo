import { describe, expect, it } from 'vitest';
import { pwaManifest } from './pwaManifest';

describe('PWA manifest', () => {
	it('launches through the session-aware root route', () => {
		expect(pwaManifest.start_url).toBe('/');
	});
});

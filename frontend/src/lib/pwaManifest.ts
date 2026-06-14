import type { SvelteKitPWAOptions } from '@vite-pwa/sveltekit';

export const pwaManifest = {
	name: 'Todo',
	short_name: 'Todo',
	display: 'standalone',
	start_url: '/',
	theme_color: '#ffffff',
	background_color: '#ffffff',
	icons: [
		{ src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
		{ src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
	],
} satisfies Exclude<SvelteKitPWAOptions['manifest'], false | undefined>;

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

declare module 'virtual:pwa-info' {
	export const pwaInfo: {
		webManifest: { linkTag: string };
	} | undefined;
}

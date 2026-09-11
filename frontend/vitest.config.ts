import { resolve } from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ['browser'],
    alias: {
      $lib: resolve(__dirname, 'src/lib'),
      $app: resolve(__dirname, 'node_modules/@sveltejs/kit/src/runtime/app'),
      'virtual:pwa-info': resolve(__dirname, 'src/lib/test/pwaInfo.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['src/vitest.setup.ts'],
    testTimeout: 10000,
  },
});

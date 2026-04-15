/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@vite-pwa/sveltekit/client" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  /^\/api\/lists(\/.*)?$/,
  new NetworkFirst({
    cacheName: 'api-lists',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 86400 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  /^\/api\/users\/me$/,
  new NetworkFirst({
    cacheName: 'api-user',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({ maxEntries: 1, maxAgeSeconds: 86400 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title: string = data.title ?? 'Todo';
  const body: string = data.body ?? '';
  const url: string = data.url ?? '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/pwa-192x192.png',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url: string = event.notification.data?.url ?? '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url) && 'focus' in c);
      if (existing) return (existing as WindowClient).focus();
      return self.clients.openWindow(url);
    })
  );
});

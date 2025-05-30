/**
 * Gitty-Gitty-Git-Er Service Worker
 * Handles caching and offline functionality for the PWA
 */

// Import Workbox modules using ES module imports
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache all static assets defined in the manifest
precacheAndRoute(self.__WB_MANIFEST);

const CACHE_NAME = 'gitty-git-er-v1';

// API routes to cache on successful fetch
const API_ROUTES = [
  { urlPattern: /\/api\/user\//, cacheName: 'user-data', maxAgeSeconds: 3600 },
  { urlPattern: /\/api\/repos\//, cacheName: 'repo-data', maxAgeSeconds: 3600 },
  { urlPattern: /\/api\/prs\//, cacheName: 'pr-data', maxAgeSeconds: 300 }
];

// Install event - Workbox will handle precaching
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              if (cacheName.startsWith('gitty-git-er-') && cacheName !== CACHE_NAME) {
                console.log('[Service Worker] Deleting old cache:', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        })
    ])
  );
});

// Helper function to determine if a request should be cached
function shouldCache(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);

  // Don't cache auth requests
  if (url.pathname.includes('/auth/')) return false;

  // Check if the URL matches any of our API_ROUTES patterns
  for (const route of API_ROUTES) {
    if (route.urlPattern.test(url.pathname)) {
      return route.cacheName;
    }
  }

  // Cache assets from our own origin
  if (url.origin === location.origin) {
    return CACHE_NAME;
  }

  return false;
}

// Fetch event - serve cached content when available
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const cacheName = shouldCache(event.request);

  if (!cacheName) {
    // Always fetch from network if not caching
    event.respondWith(fetch(event.request));
    return;
  }

  // Use stale-while-revalidate strategy for cached requests
  event.respondWith(
    caches.open(cacheName)
      .then(cache => {
        return cache.match(event.request)
          .then(cachedResponse => {
            const fetchPromise = fetch(event.request)
              .then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                  cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
              })
              .catch(error => {
                console.warn('[Service Worker] Fetch failed; serving cached content instead.', error);
                // If network fetch fails, we'll fall back to cached content
                return cachedResponse;
              });

            // Return cached response if available, otherwise wait for network
            return cachedResponse || fetchPromise;
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background Sync', event.tag);

  if (event.tag.startsWith('github-action-')) {
    event.waitUntil(processBackgroundSync(event.tag));
  }
});

// Process background sync events
async function processBackgroundSync(tag) {
  try {
    const db = await openDatabase();
    const tx = db.transaction('pendingActions', 'readwrite');
    const store = tx.objectStore('pendingActions');
    const pendingActions = await store.getAll();

    for (const action of pendingActions) {
      if (action.syncTag === tag) {
        try {
          const response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action)
          });

          if (response.ok) {
            await store.delete(action.id);
            console.log('[Service Worker] Successfully processed action:', action.id);
          } else {
            console.error('[Service Worker] Failed to process action:', await response.text());
          }
        } catch (error) {
          console.error('[Service Worker] Error processing action:', error);
        }
      }
    }

    await tx.complete;
    db.close();
  } catch (error) {
    console.error('[Service Worker] Error in background sync:', error);
  }
}

// Open IndexedDB database
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gittyGitErDB', 1);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingActions')) {
        const store = db.createObjectStore('pendingActions', { keyPath: 'id' });
        store.createIndex('syncTag', 'syncTag', { unique: false });
      }
    };
  });
}

// Handle push notifications
self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received:', event);

  let notificationData = {};

  try {
    notificationData = event.data.json();
  } catch (error) {
    notificationData = {
      title: 'Gitty-Gitty-Git-Er Notification',
      body: event.data ? event.data.text() : 'New GitHub activity'
    };
  }

  const title = notificationData.title || 'Gitty-Gitty-Git-Er';
  const options = {
    body: notificationData.body || 'New GitHub activity',
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/badge-72x72.png',
    data: notificationData.data || {},
    actions: notificationData.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click:', event.notification.tag);

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        const notificationData = event.notification.data;
        const url = notificationData && notificationData.url ? notificationData.url : '/';

        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

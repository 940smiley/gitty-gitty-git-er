/**
 * Gitty-Gitty-Git-Er Service Worker
 * Handles caching and offline functionality for the PWA
 */

const CACHE_NAME = 'gitty-git-er-v1';

// Assets to cache immediately on installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/api.js',
  '/js/ui.js',
  '/js/cache.js',
  '/manifest.json',
  '/images/logo.svg',
  '/images/icons/icon-72x72.png',
  '/images/icons/icon-96x96.png',
  '/images/icons/icon-128x128.png',
  '/images/icons/icon-144x144.png',
  '/images/icons/icon-152x152.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-384x384.png',
  '/images/icons/icon-512x512.png'
];

// API routes to cache on successful fetch
const API_ROUTES = [
  // GitHub API routes that should be cached
  { urlPattern: /\/api\/user\//, cacheName: 'user-data', maxAgeSeconds: 3600 },
  { urlPattern: /\/api\/repos\//, cacheName: 'repo-data', maxAgeSeconds: 3600 },
  { urlPattern: /\/api\/prs\//, cacheName: 'pr-data', maxAgeSeconds: 300 }
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  // Cache static assets
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(error => {
        console.error('[Service Worker] Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  // Claim clients to ensure the service worker controls all pages immediately
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete caches that start with 'gitty-git-er-' but aren't the current version
            if (cacheName.startsWith('gitty-git-er-') && cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});

// Helper function to determine if a request should be cached
function shouldCache(request) {
  // Only cache GET requests
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
  
  // Don't cache other requests
  return false;
}

// Fetch event - serve cached content when available
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  const cacheName = shouldCache(event.request);
  
  // If we shouldn't cache this request, just fetch it from the network
  if (!cacheName) {
    return;
  }
  
  // For requests we want to cache, use the stale-while-revalidate strategy
  event.respondWith(
    caches.open(cacheName)
      .then(cache => {
        return cache.match(event.request)
          .then(cachedResponse => {
            // Create a promise to fetch from network and update cache
            const fetchPromise = fetch(event.request)
              .then(networkResponse => {
                // If we got a valid response, copy and store it in the cache
                if (networkResponse && networkResponse.status === 200) {
                  // Clone the response as it can only be consumed once
                  cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
              })
              .catch(error => {
                console.warn('[Service Worker] Fetch failed; serving cached content instead.', error);
                // If network fetch fails, we'll fall back to cached content
              });
            
            // Return the cached response if we have one, otherwise wait for the network response
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
    // Get pending actions from IndexedDB
    const db = await openDatabase();
    const tx = db.transaction('pendingActions', 'readwrite');
    const store = tx.objectStore('pendingActions');
    
    // Get actions that match the sync tag
    const pendingActions = await store.getAll();
    console.log('[Service Worker] Pending actions:', pendingActions);
    
    // Process each action
    for (const action of pendingActions) {
      if (action.syncTag === tag) {
        try {
          // Send the action to the API
          const response = await fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(action)
          });
          
          if (response.ok) {
            // If successful, remove the action from the store
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
      
      // Create pendingActions object store if it doesn't exist
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
    // If it's not JSON, treat it as plain text
    notificationData = {
      title: 'Gitty-Gitty-Git-Er Notification',
      body: event.data.text()
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
  
  // This looks to see if the target URL is already open and focuses it
  // Otherwise, it opens a new window/tab
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        const notificationData = event.notification.data;
        const url = notificationData.url || '/';
        
        // Check if there is already a window/tab open with this URL
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

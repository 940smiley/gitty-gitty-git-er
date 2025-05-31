// Version control for caches
const CACHE_VERSION = 'v2';
const STATIC_CACHE_NAME = `gitty-static-${CACHE_VERSION}`;
const ASSETS_CACHE_NAME = `gitty-assets-${CACHE_VERSION}`;
const API_CACHE_NAME = `gitty-api-${CACHE_VERSION}`;
const GITHUB_API_CACHE_NAME = `gitty-github-api-${CACHE_VERSION}`;

// Define assets to cache on install
const staticAssets = [
  './',
  './index.html',
  './favicon.svg',
  './favicon.ico',
  './manifest.json',
  './apple-touch-icon.png',
  './robots.txt'
];

// Define the icon assets to cache
const iconAssets = [
  './icons/icon-72x72.png',
  './icons/icon-72x72-maskable.png',
  './icons/icon-96x96.png',
  './icons/icon-96x96-maskable.png',
  './icons/icon-128x128.png',
  './icons/icon-128x128-maskable.png',
  './icons/icon-144x144.png',
  './icons/icon-144x144-maskable.png',
  './icons/icon-152x152.png',
  './icons/icon-152x152-maskable.png',
  './icons/icon-192x192.png',
  './icons/icon-192x192-maskable.png',
  './icons/icon-384x384.png',
  './icons/icon-384x384-maskable.png',
  './icons/icon-512x512.png',
  './icons/icon-512x512-maskable.png',
  './icons/shortcut-repos.png',
  './icons/shortcut-ai.png'
];

// All caches used by the app
const ALL_CACHES = [
  STATIC_CACHE_NAME, 
  ASSETS_CACHE_NAME, 
  API_CACHE_NAME, 
  GITHUB_API_CACHE_NAME
];

// Helper function to identify offline fallback route
const isNavigationRequest = (request) => {
  return request.mode === 'navigate';
};

// Helper to determine if this is a GitHub API request
const isGitHubApiRequest = (url) => {
  return url.includes('api.github.com');
};

// Helper to determine if this is a local API request
const isLocalApiRequest = (url) => {
  return url.includes('/api/');
};

// Helper to determine if this is an asset request
const isAssetRequest = (url) => {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/.test(url);
};

// Install service worker and cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...', event);
  
  // Skip waiting to update immediately
  self.skipWaiting();
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME)
        .then((cache) => {
          console.log('[Service Worker] Caching static content');
          return cache.addAll(staticAssets);
        }),
      
      // Cache icon assets
      caches.open(ASSETS_CACHE_NAME)
        .then((cache) => {
          console.log('[Service Worker] Caching icon content');
          return cache.addAll(iconAssets);
        })
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...', event);
  
  // Claim clients to take control immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      
      // Clean up old caches
      caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
          // Remove any cache that's not in our whitelist
          if (!ALL_CACHES.includes(key)) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
    ])
  );
  
  return self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle navigation requests with network-first strategy
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache a copy of the response
          const clonedResponse = response.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // If offline, try to serve from cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If not in cache, serve the offline fallback
              return caches.match('./index.html');
            });
        })
    );
    return;
  }
  
  // Handle GitHub API requests with network-first + timeout
  if (isGitHubApiRequest(url.href)) {
    const networkTimeoutSeconds = 10;
    
    // Promise for the network request with timeout
    const networkPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Network request timed out'));
      }, networkTimeoutSeconds * 1000);
      
      fetch(event.request.clone())
        .then((response) => {
          clearTimeout(timeoutId);
          
          // Cache the response if valid
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(GITHUB_API_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          
          resolve(response);
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
    });
    
    // Promise for the cached response
    const cachePromise = caches.match(event.request);
    
    event.respondWith(
      Promise.race([
        networkPromise,
        // If network request takes too long, we'll use the cache
        new Promise((resolve) => {
          setTimeout(() => {
            cachePromise.then((cachedResponse) => {
              if (cachedResponse) {
                resolve(cachedResponse);
              }
            });
          }, networkTimeoutSeconds * 1000);
        })
      ])
      .catch(() => {
        // If both fail, try cache again, then offline fallback
        return cachePromise
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Return a JSON response indicating offline status
            return new Response(
              JSON.stringify({
                error: 'You are offline and the requested data is not cached.',
                offline: true
              }),
              {
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
      })
    );
    return;
  }
  
  // Handle local API requests
  if (isLocalApiRequest(url.href)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache a copy of the response
          const clonedResponse = response.clone();
          caches.open(API_CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // If offline, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Handle asset requests with cache-first strategy
  if (isAssetRequest(url.href)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If not in cache, fetch from network and cache
          return fetch(event.request)
            .then((response) => {
              // Cache the asset for future use
              const clonedResponse = response.clone();
              caches.open(ASSETS_CACHE_NAME).then((cache) => {
                cache.put(event.request, clonedResponse);
              });
              return response;
            });
        })
    );
    return;
  }
  
  // Default to network-first strategy for all other requests
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a copy of the response
        const clonedResponse = response.clone();
        caches.open(STATIC_CACHE_NAME).then((cache) => {
          cache.put(event.request, clonedResponse);
        });
        return response;
      })
      .catch(() => {
        // If offline, try to serve from cache
        return caches.match(event.request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Syncing', event);
  
  if (event.tag === 'github-sync') {
    event.waitUntil(
      // Get all pending actions from IndexedDB
      self.indexedDB.open('gitty-offline-db', 1).then((db) => {
        const tx = db.transaction('pending-actions', 'readwrite');
        const store = tx.objectStore('pending-actions');
        
        return store.getAll().then((actions) => {
          // Process each action
          return Promise.all(actions.map((action) => {
            // Try to send the action to the server
            return fetch(action.url, {
              method: action.method,
              headers: action.headers,
              body: action.body ? JSON.stringify(action.body) : undefined
            })
            .then((response) => {
              if (response.ok) {
                // If successful, remove from store
                return store.delete(action.id);
              }
              // If failed, keep in store for next sync
              throw new Error('Sync failed');
            });
          }))
          .then(() => {
            // Notify clients that sync is complete
            return self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: 'SYNC_COMPLETE',
                  success: true
                });
              });
            });
          })
          .catch((error) => {
            console.error('Sync failed:', error);
            // Notify clients that sync failed
            return self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: 'SYNC_COMPLETE',
                  success: false,
                  error: error.message
                });
              });
            });
          });
        });
      })
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received', event);
  
  let data = { title: 'Gitty Update', body: 'Something new happened!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  // Use default icon if specialized notification badge is not available
  const badgeIconPath = './icons/notification-badge.png';
  const iconPath = './icons/icon-192x192.png';
  
  // Check if the icons exist before using them
  const options = {
    body: data.body,
    icon: iconPath,
    // The badge icon is optional and will only be used if it exists
    data: data.data || {},
    actions: data.actions || []
  };
  
  // Only add badge if it exists
  caches.match(badgeIconPath).then(response => {
    if (response) {
      options.badge = badgeIconPath;
    }
  });
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification Click', event);
  
  event.notification.close();
  
  // Handle notification click
  if (event.action) {
    // Handle specific actions
    console.log(`User selected notification action: ${event.action}`);
  }
  
  // Open or focus the app at the right location
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // If we have a client already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise open a new window
        if (self.clients.openWindow) {
          const url = event.notification.data.url || './';
          return self.clients.openWindow(url);
        }
      })
  );
});

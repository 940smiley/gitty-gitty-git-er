/**
 * Gitty-Gitty-Git-Er
 * Cache module for offline data storage
 */

// Cache configuration
const CACHE_CONFIG = {
  dbName: 'gittyGitErDB',
  dbVersion: 1,
  stores: {
    repositories: { keyPath: 'id' },
    pullRequests: { keyPath: 'id' },
    files: { keyPath: 'path' },
    userData: { keyPath: 'id' },
    pendingActions: { keyPath: 'id' }
  },
  expirationTime: {
    repositories: 24 * 60 * 60 * 1000, // 24 hours
    pullRequests: 15 * 60 * 1000, // 15 minutes
    files: 12 * 60 * 60 * 1000, // 12 hours
    userData: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Cache state
let cacheState = {
  db: null,
  isInitialized: false,
  offlineMode: false,
  callbacks: {}
};

/**
 * Initialize the cache module
 * @param {Object} options - Initialization options
 * @param {Function} options.onSyncComplete - Callback after sync completes
 * @returns {Promise<void>}
 */
async function initCache(options = {}) {
  console.log('Initializing cache module...');
  
  // Store callbacks
  if (options.onSyncComplete) {
    cacheState.callbacks.onSyncComplete = options.onSyncComplete;
  }
  
  // Check if offline mode is enabled
  cacheState.offlineMode = localStorage.getItem('offlineMode') === 'true';
  
  try {
    // Open the database
    cacheState.db = await openDatabase();
    cacheState.isInitialized = true;
    
    // Register sync event listener
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'sync-complete') {
          handleSyncComplete(event.data.items);
        }
      });
    }
    
    console.log('Cache initialization complete');
  } catch (error) {
    console.error('Failed to initialize cache:', error);
  }
}

/**
 * Open IndexedDB database
 * @returns {Promise<IDBDatabase>} Database instance
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_CONFIG.dbName, CACHE_CONFIG.dbVersion);
    
    request.onerror = event => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
    
    request.onsuccess = event => {
      const db = event.target.result;
      resolve(db);
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      for (const [storeName, storeConfig] of Object.entries(CACHE_CONFIG.stores)) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, storeConfig);
          
          // Add any indexes
          if (storeName === 'repositories') {
            store.createIndex('owner', 'owner.login', { unique: false });
            store.createIndex('updatedAt', 'updated_at', { unique: false });
          } else if (storeName === 'pullRequests') {
            store.createIndex('repository', 'repository.full_name', { unique: false });
            store.createIndex('state', 'state', { unique: false });
          } else if (storeName === 'files') {
            store.createIndex('repo', 'repo', { unique: false });
            store.createIndex('type', 'type', { unique: false });
          } else if (storeName === 'pendingActions') {
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('syncTag', 'syncTag', { unique: false });
          }
        }
      }
    };
  });
}

/**
 * Store data in the cache
 * @param {string} storeName - Name of the store
 * @param {Array|Object} data - Data to store
 * @returns {Promise<void>}
 */
async function storeData(storeName, data) {
  if (!cacheState.isInitialized) {
    throw new Error('Cache is not initialized');
  }
  
  if (!CACHE_CONFIG.stores[storeName]) {
    throw new Error(`Store "${storeName}" does not exist`);
  }
  
  return new Promise((resolve, reject) => {
    const transaction = cacheState.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    transaction.onerror = event => {
      reject(event.target.error);
    };
    
    transaction.oncomplete = () => {
      resolve();
    };
    
    // Add timestamp for expiration
    const now = Date.now();
    
    // Store array of items
    if (Array.isArray(data)) {
      data.forEach(item => {
        const dataWithTimestamp = {
          ...item,
          _timestamp: now
        };
        store.put(dataWithTimestamp);
      });
    } else {
      // Store single item
      const dataWithTimestamp = {
        ...data,
        _timestamp: now
      };
      store.put(dataWithTimestamp);
    }
  });
}

/**
 * Retrieve data from the cache
 * @param {string} storeName - Name of the store
 * @param {string|number} [key] - Key to retrieve (if omitted, returns all)
 * @returns {Promise<Array|Object>} Retrieved data
 */
async function retrieveData(storeName, key = null) {
  if (!cacheState.isInitialized) {
    throw new Error('Cache is not initialized');
  }
  
  if (!CACHE_CONFIG.stores[storeName]) {
    throw new Error(`Store "${storeName}" does not exist`);
  }
  
  return new Promise((resolve, reject) => {
    const transaction = cacheState.db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    transaction.onerror = event => {
      reject(event.target.error);
    };
    
    if (key !== null) {
      // Retrieve single item
      const request = store.get(key);
      request.onsuccess = event => {
        const data = event.target.result;
        
        // Check if data is expired
        if (data && isDataExpired(data, storeName)) {
          resolve(null);
        } else {
          resolve(data);
        }
      };
    } else {
      // Retrieve all items
      const request = store.getAll();
      request.onsuccess = event => {
        const items = event.target.result.filter(item => !isDataExpired(item, storeName));
        resolve(items);
      };
    }
  });
}

/**
 * Query data in the cache using an index
 * @param {string} storeName - Name of the store
 * @param {string} indexName - Name of the index
 * @param {*} value - Value to query for
 * @returns {Promise<Array>} Retrieved data
 */
async function queryByIndex(storeName, indexName, value) {
  if (!cacheState.isInitialized) {
    throw new Error('Cache is not initialized');
  }
  
  if (!CACHE_CONFIG.stores[storeName]) {
    throw new Error(`Store "${storeName}" does not exist`);
  }
  
  return new Promise((resolve, reject) => {
    const transaction = cacheState.db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    // Check if index exists
    if (!store.indexNames.contains(indexName)) {
      reject(new Error(`Index "${indexName}" does not exist on store "${storeName}"`));
      return;
    }
    
    transaction.onerror = event => {
      reject(event.target.error);
    };
    
    const index = store.index(indexName);
    const request = index.getAll(value);
    
    request.onsuccess = event => {
      // Filter out expired items
      const items = event.target.result.filter(item => !isDataExpired(item, storeName));
      resolve(items);
    };
  });
}

/**
 * Check if data is expired
 * @param {Object} data - Data object with _timestamp
 * @param {string} storeName - Store name for expiration config
 * @returns {boolean} Whether the data is expired
 */
function isDataExpired(data, storeName) {
  if (!data._timestamp) return false;
  
  const expirationTime = CACHE_CONFIG.expirationTime[storeName];
  if (!expirationTime) return false;
  
  return Date.now() - data._timestamp > expirationTime;
}

/**
 * Remove data from the cache
 * @param {string} storeName - Name of the store
 * @param {string|number} key - Key to remove
 * @returns {Promise<void>}
 */
async function removeData(storeName, key) {
  if (!cacheState.isInitialized) {
    throw new Error('Cache is not initialized');
  }
  
  if (!CACHE_CONFIG.stores[storeName]) {
    throw new Error(`Store "${storeName}" does not exist`);
  }
  
  return new Promise((resolve, reject) => {
    const transaction = cacheState.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    transaction.onerror = event => {
      reject(event.target.error);
    };
    
    transaction.oncomplete = () => {
      resolve();
    };
    
    store.delete(key);
  });
}

/**
 * Clear all data in a store
 * @param {string} storeName - Name of the store
 * @returns {Promise<void>}
 */
async function clearStore(storeName) {
  if (!cacheState.isInitialized) {
    throw new Error('Cache is not initialized');
  }
  
  if (!CACHE_CONFIG.stores[storeName]) {
    throw new Error(`Store "${storeName}" does not exist`);
  }
  
  return new Promise((resolve, reject) => {
    const transaction = cacheState.db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    transaction.onerror = event => {
      reject(event.target.error);
    };
    
    transaction.oncomplete = () => {
      resolve();
    };
    
    store.clear();
  });
}

/**
 * Clear expired data from all stores
 * @returns {Promise<void>}
 */
async function clearExpiredData() {
  if (!cacheState.isInitialized) {
    throw new Error('Cache is not initialized');
  }
  
  try {
    for (const storeName of Object.keys(CACHE_CONFIG.stores)) {
      const items = await retrieveData(storeName);
      
      // retrieveData already filters out expired items, so we need to get all items
      // and manually check which ones are expired
      const transaction = cacheState.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.getAll();
      
      await new Promise((resolve, reject) => {
        request.onsuccess = async event => {
          const allItems = event.target.result;
          
          // Delete expired items
          for (const item of allItems) {
            if (isDataExpired(item, storeName)) {
              store.delete(item[CACHE_CONFIG.stores[storeName].keyPath]);
            }
          }
          
          transaction.oncomplete = resolve;
          transaction.onerror = reject;
        };
        
        request.onerror = reject;
      });
    }
    
    console.log('Cleared expired cache data');
  } catch (error) {
    console.error('Error clearing expired data:', error);
  }
}

/**
 * Store a pending action for sync
 * @param {Object} action - Action to store
 * @returns {Promise<string>} ID of the stored action
 */
async function storePendingAction(action) {
  if (!cacheState.isInitialized) {
    throw new Error('Cache is not initialized');
  }
  
  return new Promise((resolve, reject) => {
    const transaction = cacheState.db.transaction('pendingActions', 'readwrite');
    const store = transaction.objectStore('pendingActions');
    
    transaction.onerror = event => {
      reject(event.target.error);
    };
    
    // Create a unique ID and sync tag for this action
    const id = Date.now().toString();
    const syncTag = `github-action-${id}`;
    
    const pendingAction = {
      id,
      syncTag,
      timestamp: Date.now(),
      ...action
    };
    
    const request = store.add(pendingAction);
    
    request.onsuccess = () => {
      resolve(id);
    };
  });
}

/**
 * Get all pending actions
 * @returns {Promise<Array>} List of pending actions
 */
async function getPendingActions() {
  if (!cacheState.isInitialized) {
    throw new Error('Cache is not initialized');
  }
  
  return retrieveData('pendingActions');
}

/**
 * Remove a pending action
 * @param {string} id - ID of the action to remove
 * @returns {Promise<void>}
 */
async function removePendingAction(id) {
  if (!cacheState.isInitialized) {
    throw new Error('Cache is not initialized');
  }
  
  return removeData('pendingActions', id);
}

/**
 * Sync cached data with the server when coming online
 * @returns {Promise<Array>} List of synced items
 */
async function syncData() {
  if (!cacheState.isInitialized || !navigator.onLine) {
    return [];
  }
  
  try {
    // Get pending actions
    const pendingActions = await getPendingActions();
    
    if (pendingActions.length === 0) {
      return [];
    }
    
    console.log(`Syncing ${pendingActions.length} pending actions`);
    
    // Register sync with service worker if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      
      // Register a sync for each pending action
      for (const action of pendingActions) {
        await registration.sync.register(action.syncTag);
      }
      
      // Return the actions that will be synced
      return pendingActions;
    } else {
      // Fallback for browsers without Background Sync support
      const syncedItems = [];
      
      for (const action of pendingActions) {
        try {
          // Process the action manually
          await processAction(action);
          await removePendingAction(action.id);
          syncedItems.push(action);
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
        }
      }
      
      // Notify about completed sync
      if (cacheState.callbacks.onSyncComplete) {
        cacheState.callbacks.onSyncComplete(syncedItems);
      }
      
      return syncedItems;
    }
  } catch (error) {
    console.error('Error syncing data:', error);
    return [];
  }
}

/**
 * Process a pending action manually
 * @param {Object} action - Action to process
 * @returns {Promise<Object>} Response data
 */
async function processAction(action) {
  // This would typically call the API directly
  // In this case, we're letting the service worker handle it
  // This is just a fallback for browsers without service worker support
  
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(action)
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Handle sync completion message from service worker
 * @param {Array} syncedItems - Items that were synced
 */
function handleSyncComplete(syncedItems) {
  console.log(`Sync completed for ${syncedItems.length} items`);
  
  // Call the callback
  if (cacheState.callbacks.onSyncComplete) {
    cacheState.callbacks.onSyncComplete(syncedItems);
  }
}

/**
 * Set offline mode
 * @param {boolean} enabled - Whether offline mode is enabled
 */
function setOfflineMode(enabled) {
  cacheState.offlineMode = enabled;
  localStorage.setItem('offlineMode', enabled);
}

/**
 * Check if offline mode is enabled
 * @returns {boolean} Whether offline mode is enabled
 */
function isOfflineModeEnabled() {
  return cacheState.offlineMode;
}

// Schedule periodic cleanup of expired data
setInterval(clearExpiredData, 60 * 60 * 1000); // Every hour

// Export cache functions
export {
  initCache,
  storeData,
  retrieveData,
  queryByIndex,
  removeData,
  clearStore,
  clearExpiredData,
  storePendingAction,
  getPendingActions,
  removePendingAction,
  syncData,
  setOfflineMode,
  isOfflineModeEnabled
};

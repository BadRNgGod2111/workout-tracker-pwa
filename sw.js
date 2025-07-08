/**
 * Workout Tracker Service Worker
 * Provides offline functionality, caching strategies, and background sync
 */

const CACHE_NAME = 'workout-tracker-v3';
const DATA_CACHE_NAME = 'workout-tracker-data-v1';
const SYNC_CACHE_NAME = 'workout-tracker-sync-v1';

// App Shell - Core files that rarely change
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/css/app.css',
  '/css/ios-theme.css',
  '/css/user-profile.css',
  '/js/app.js',
  '/js/database.js',
  '/js/exercises.js',
  '/js/workouts.js',
  '/js/plans.js',
  '/js/statistics.js',
  '/js/charts.js',
  '/js/progress.js',
  '/js/timers.js',
  '/js/timer-ui.js',
  '/js/notifications.js',
  '/js/data-manager.js',
  '/js/user-profile.js',
  '/js/profile-ui.js',
  '/data/exercises.json',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/debug.html',
  '/test-fixes.html',
  '/offline.html'
];

// Static data files that should be cached
const STATIC_DATA_FILES = [
  '/data/exercises.json'
];

// Install event - Cache app shell
self.addEventListener('install', event => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL_FILES);
      })
      .then(() => {
        console.log('[SW] App shell cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Error caching app shell:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== DATA_CACHE_NAME && 
                cacheName !== SYNC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Cache cleanup complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - Implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (request.method === 'GET') {
    // App Shell files - Cache First
    if (APP_SHELL_FILES.includes(url.pathname) || url.pathname === '/') {
      event.respondWith(cacheFirst(request));
    }
    // Static data files - Cache First
    else if (STATIC_DATA_FILES.includes(url.pathname)) {
      event.respondWith(cacheFirst(request));
    }
    // Images and icons - Cache First with fallback
    else if (request.destination === 'image' || url.pathname.startsWith('/icons/')) {
      event.respondWith(cacheFirstWithFallback(request));
    }
    // CSS and JS files - Stale While Revalidate
    else if (url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/')) {
      event.respondWith(staleWhileRevalidate(request));
    }
    // Other files from our domain - Cache First
    else if (url.origin === self.location.origin) {
      event.respondWith(cacheFirst(request));
    }
    // External resources - Network First
    else {
      event.respondWith(networkFirst(request));
    }
  }
  // POST/PUT/DELETE - Handle background sync
  else if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    event.respondWith(handleDataModification(request));
  }
});

// Cache First Strategy - For app shell
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Cache hit for:', request.url);
      return cachedResponse;
    }
    
    console.log('[SW] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached new resource:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed for:', request.url, error);
    
    // If it's the main page, serve the offline page
    if (request.url.includes('index.html') || request.url.endsWith('/')) {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // Try to return any cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Last resort - return a basic response
    return new Response('Offline - resource not available', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Cache First with Fallback - For images
async function cacheFirstWithFallback(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('[SW] Image cache failed:', error);
    // Return placeholder image or continue without image
    return new Response('', { status: 200, statusText: 'OK' });
  }
}

// Network First with Cache - For API calls
async function networkFirstWithCache(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline data structure
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'Data not available offline',
      cached: false
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale While Revalidate - For static assets
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(error => {
      console.error('[SW] Stale while revalidate failed:', error);
      return cachedResponse;
    });
  
  return cachedResponse || fetchPromise;
}

// Network First - Default strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network first failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || await caches.match('/offline.html');
  }
}

// Handle Data Modification - POST/PUT/DELETE with background sync
async function handleDataModification(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      return networkResponse;
    } else {
      throw new Error('Network response not ok');
    }
  } catch (error) {
    console.log('[SW] Data modification failed, queuing for sync:', error);
    
    // Store request for background sync
    await storeFailedRequest(request);
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      await self.registration.sync.register('workout-data-sync');
    }
    
    return new Response(JSON.stringify({
      success: false,
      queued: true,
      message: 'Request queued for when connection is restored'
    }), {
      status: 202,
      statusText: 'Accepted',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Store failed request for background sync
async function storeFailedRequest(request) {
  const cache = await caches.open(SYNC_CACHE_NAME);
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.text() : null,
    timestamp: Date.now()
  };
  
  const key = `sync-${Date.now()}-${Math.random()}`;
  await cache.put(key, new Response(JSON.stringify(requestData)));
}

// Background Sync Event
self.addEventListener('sync', event => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'workout-data-sync') {
    event.waitUntil(syncWorkoutData());
  }
});

// Sync workout data when back online
async function syncWorkoutData() {
  console.log('[SW] Syncing workout data...');
  
  try {
    const cache = await caches.open(SYNC_CACHE_NAME);
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await cache.match(request);
        const requestData = await response.json();
        
        // Recreate the original request
        const fetchOptions = {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        };
        
        const syncResponse = await fetch(requestData.url, fetchOptions);
        
        if (syncResponse.ok) {
          await cache.delete(request);
          console.log('[SW] Synced request:', requestData.url);
          
          // Notify client of successful sync
          await notifyClients('sync-success', {
            url: requestData.url,
            method: requestData.method,
            timestamp: requestData.timestamp
          });
        }
      } catch (error) {
        console.error('[SW] Error syncing request:', error);
      }
    }
    
    console.log('[SW] Background sync complete');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push event for notifications
self.addEventListener('push', event => {
  console.log('[SW] Push event received');
  
  const options = {
    body: event.data ? event.data.text() : 'Workout Tracker notification',
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-96.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/shortcut-workout.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-32.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Workout Tracker', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message event for client communication
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      cacheUrls(event.data.urls)
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      clearCache(event.data.cacheName)
    );
  }
});

// Cache additional URLs
async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  return cache.addAll(urls);
}

// Clear specific cache
async function clearCache(cacheName) {
  return caches.delete(cacheName || CACHE_NAME);
}

// Notify all clients
async function notifyClients(type, data) {
  const clients = await self.clients.matchAll();
  
  clients.forEach(client => {
    client.postMessage({
      type: type,
      data: data
    });
  });
}

// Update notification system
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    event.waitUntil(checkForUpdates());
  }
});

// Check for service worker updates
async function checkForUpdates() {
  const registration = await self.registration.update();
  
  if (registration.waiting) {
    await notifyClients('update-available', {
      message: 'New version available! Refresh to update.'
    });
  }
}

// Periodic Background Sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    if (event.tag === 'workout-backup') {
      event.waitUntil(performPeriodicSync());
    }
  });
}

// Perform periodic sync
async function performPeriodicSync() {
  console.log('[SW] Performing periodic sync...');
  
  try {
    // Sync workout data
    await syncWorkoutData();
    
    // Cache fresh data
    const cache = await caches.open(DATA_CACHE_NAME);
    const apiUrls = ['/api/exercises', '/api/workouts', '/api/plans'];
    
    for (const url of apiUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());
        }
      } catch (error) {
        console.error('[SW] Periodic sync failed for:', url, error);
      }
    }
    
    console.log('[SW] Periodic sync complete');
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error);
  }
}

// Error handling
self.addEventListener('error', event => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service Worker loaded successfully');
// Service Worker para CRM B&C Consultores
// Versión: 1.0.0
// Características: Cache offline, Push Notifications, Background Sync

const CACHE_NAME = 'bc-crm-v1';
const RUNTIME_CACHE = 'bc-runtime-v1';
const DOCUMENT_CACHE = 'bc-documents-v1';

// Archivos estáticos para cachear durante la instalación
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html', // Página offline fallback
];

// Rutas que NO deben cachearse
const CACHE_BLACKLIST = [
  '/api/',
  'supabase.co',
  'auth/v1/',
  'rest/v1/',
];

// ========================================
// INSTALACIÓN DEL SERVICE WORKER
// ========================================
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Instalando Service Worker v1.0.0');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 [SW] Cacheando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ [SW] Instalación completada');
        return self.skipWaiting(); // Activar inmediatamente
      })
      .catch((error) => {
        console.error('❌ [SW] Error en instalación:', error);
      })
  );
});

// ========================================
// ACTIVACIÓN DEL SERVICE WORKER
// ========================================
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Activando Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Eliminar caches antiguos
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && 
                     cacheName !== RUNTIME_CACHE &&
                     cacheName !== DOCUMENT_CACHE;
            })
            .map((cacheName) => {
              console.log('🗑️ [SW] Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ [SW] Activación completada');
        return self.clients.claim(); // Tomar control de todas las páginas
      })
  );
});

// ========================================
// ESTRATEGIA DE CACHE: NETWORK FIRST CON FALLBACK
// ========================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no son HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }

  // No cachear URLs en blacklist (APIs, Auth, etc)
  if (CACHE_BLACKLIST.some(pattern => request.url.includes(pattern))) {
    return; // Dejar que pase directo a la red
  }

  // Estrategia: Network First, Cache Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Solo cachear respuestas exitosas
        if (response && response.status === 200) {
          const responseClone = response.clone();
          
          // Decidir qué cache usar
          const cacheName = request.url.includes('/documents/') || 
                           request.url.includes('.pdf') 
                           ? DOCUMENT_CACHE 
                           : RUNTIME_CACHE;

          caches.open(cacheName).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        
        return response;
      })
      .catch(async () => {
        // Si falla la red, intentar desde cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
          console.log('📦 [SW] Sirviendo desde cache:', request.url);
          return cachedResponse;
        }

        // Si es navegación y no hay cache, mostrar página offline
        if (request.destination === 'document') {
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) {
            return offlinePage;
          }
        }

        // Respuesta offline genérica
        return new Response('Sin conexión. Por favor, intenta más tarde.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain',
          }),
        });
      })
  );
});

// ========================================
// PUSH NOTIFICATIONS
// ========================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido:', event);

  let notificationData = {
    title: 'Nueva notificación',
    body: 'Tienes una nueva actualización',
    icon: '/logo-192.png',
    badge: '/badge-72.png',
    tag: 'default',
    data: {}
  };

  // Parse del payload
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: true, // Mantener visible hasta que se cierre
      actions: [
        {
          action: 'open',
          title: 'Ver detalles'
        },
        {
          action: 'close',
          title: 'Cerrar'
        }
      ]
    })
  );
});

// ========================================
// ACCIONES DE NOTIFICACIONES
// ========================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Click en notificación:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Buscar si ya hay una ventana abierta
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no hay ventana, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ========================================
// BACKGROUND SYNC (Futuro)
// ========================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-documents') {
    event.waitUntil(syncDocuments());
  }
});

async function syncDocuments() {
  console.log('[SW] Sincronizando documentos...');
  // Implementación futura para sincronizar documentos offline
}

// ========================================
// MENSAJES DEL CLIENTE
// ========================================
self.addEventListener('message', (event) => {
  console.log('[SW] Mensaje recibido:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service Worker cargado correctamente');
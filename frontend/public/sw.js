// frontend/public/sw.js
self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/pwa-192x192.png', // Ensure this exists in public/
    badge: '/masked-icon.svg',
    data: { url: data.url }
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
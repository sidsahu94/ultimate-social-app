// frontend/public/sw.js
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  
  self.registration.showNotification(data.title || 'SocialVerse ∞', {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/logo.svg',
    data: { url: data.url || '/' }
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification?.data?.url || '/')
  );
});
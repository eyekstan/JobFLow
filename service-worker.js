const CACHE_NAME = 'jobflow-v10';
const ASSETS_TO_CACHE = [
  './', './index.html', './app.js', './styles.css', './tailwind-compiled.css',
  './lib/store.js', './lib/photodb.js',
  './components/ProjectCard.js', './components/ActionButton.js',
  './screens/DashboardScreen.js', './screens/QuickCaptureScreen.js',
  './screens/ProjectDetailScreen.js', './screens/PipelineScreen.js',
  './screens/CalendarScreen.js', './screens/SettingsScreen.js',
  './screens/ArchiveScreen.js', './screens/CustomersScreen.js',
  './screens/CustomerDetailScreen.js', './screens/OnboardingScreen.js',
  './screens/EstimateScreen.js', './screens/MaterialsScreen.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return response;
      });
    }).catch(() => caches.match('./index.html'))
  );
});

// Notification click — open the app when user taps a reminder
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const projectId = event.notification.data && event.notification.data.projectId;
  const urlToOpen = projectId
    ? self.registration.scope + '#project/' + projectId
    : self.registration.scope;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

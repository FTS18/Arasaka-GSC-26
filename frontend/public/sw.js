importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
    console.log('Workbox is loaded');

    // Cache API GET requests
    workbox.routing.registerRoute(
        ({ url }) => url.pathname.startsWith('/api/') && (!url.pathname.includes('/matching/')),
        new workbox.strategies.NetworkFirst({
            cacheName: 'api-cache',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 24 * 60 * 60, // 24 hours
                }),
            ],
        }),
        'GET'
    );

    // Background Sync for POST / PATCH (Updates, new requests)
    const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('janrakshak-queue', {
        maxRetentionTime: 24 * 60 // Retry for max of 24 Hours (specified in minutes)
    });

    workbox.routing.registerRoute(
        ({ url }) => url.pathname.startsWith('/api/citizen/reports') || url.pathname.startsWith('/api/missions'),
        new workbox.strategies.NetworkOnly({
            plugins: [bgSyncPlugin]
        }),
        'POST'
    );

    workbox.routing.registerRoute(
        ({ url }) => url.pathname.startsWith('/api/missions'),
        new workbox.strategies.NetworkOnly({
            plugins: [bgSyncPlugin]
        }),
        'PATCH'
    );

    // Cache Map Tiles
    workbox.routing.registerRoute(
        ({ url }) => url.origin === 'https://cartocdn.com' || url.href.includes('basemaps.cartocdn.com'),
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'map-tiles-cache',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 200,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                }),
            ],
        })
    );

    // Cache basic static assets
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'script' || request.destination === 'style' || request.destination === 'image',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'static-resources',
        })
    );

} else {
    console.log('Workbox failed to load');
}

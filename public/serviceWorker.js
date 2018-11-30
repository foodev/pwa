'use strict';

const VERSION = '1.0.0';
const VERSION_MAJOR = parseInt(VERSION, 10);
const CACHE_NAME_STATIC = 'pwa-static-' + VERSION_MAJOR;

// This event will be fired at first when a new version of the service worker was detected
//
// A new version of the service worker is the same as a new version of the web app.
// At this point, we should make sure to cache each possible resource/URL
// (like CSS, JavaScript, images, etc.) so later we can use the web app
// offline. This is similar to downloading a "real" app.
self.addEventListener('install', function(event) {
    console.log('Installing version %s...', VERSION);

    event.waitUntil(
        // Cache each single resource which will be needed by the web app
        caches.open(CACHE_NAME_STATIC).then(function(cache) {
            return cache.addAll([
                '/',
                '/manifest.webmanifest',
                '/icon-192.png',
                '/icon-512.png',
                '/css/stylesheet.css',
                '/javascript/app.js'
            ])
        })
    );
});

// This event will fire after the installation of the new version has finished
//
// When we install a new major version, we also create a new cache. So now we
// have to delete any old caches around. Then the new version is ready to use.
self.addEventListener('activate', function(event) {
    event.waitUntil(
        // Delete all previous cached resources
        caches.keys().then(function(cacheNames) {
            return Promise.all(cacheNames.map(function(cacheName) {
                if ([CACHE_NAME_STATIC].indexOf(cacheName) === -1) {
                    console.log('Deleted old cache "%s"', cacheName);

                    return caches.delete(cacheName);
                }
            }));
        })
    );
});


// Whenever a resource (i.e. URL) is requested, this event will be fired
//
// Here we actually hijack the request and try to load the requested resource
// from the cache. For this to work, we had to cache every possible resource/URL
// explicitly during the "install" phase.
self.addEventListener('fetch', function(event) {
    event.respondWith(
        // Look for the requested resource in all available caches
        caches.match(event.request).then(function(response) {
            console.log('[Cache Hit] %s %s', event.request.method, event.request.url);

            return response;
        })
    );
});

// The client can communicate with the service worker through postMessage
//
// action = activate: A new version of the web app has been installed and should be activated.
self.addEventListener('message', function(event) {
    if (event.data.action == 'activate') {
        // Usually the new version of the service worker will only be activated
        // after the user closed the current browser tab/window.
        // But with "skipWaiting()" we can change that behaviour
        // and the new version will take over immediately and kick out the old one.
        self.skipWaiting();
    }
});

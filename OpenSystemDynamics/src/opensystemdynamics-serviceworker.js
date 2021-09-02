self.addEventListener('install', function(event) {
    console.log('install event', event);
});

self.addEventListener('fetch', function(event) {
    console.log('fetch event', event);
});

console.log('in service worker');
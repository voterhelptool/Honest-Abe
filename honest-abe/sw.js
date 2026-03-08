/**
 * HONEST ABE — sw.js
 * Service worker for PWA offline support.
 * Core files cached on install. Pattern matching works offline always.
 */

const CACHE    = "honest-abe-v1";
const PRECACHE = [
    "/",
    "/index.html",
    "/ethics.js",
    "/truth-model.js",
    "/hallucination-guard.js",
    "/nlp.js",
    "/agent.js",
    "/adapters/pattern.js",
    "/adapters/puter.js",
    "/adapters/mlvoca.js",
    "/adapters/huggingface.js",
    "/adapters/mistral.js",
    "/adapters/webllm.js",
];

self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE).then(c => c.addAll(PRECACHE))
    );
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Network first, cache fallback
self.addEventListener("fetch", e => {
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});

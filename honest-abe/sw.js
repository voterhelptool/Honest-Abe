/**
 * HONEST ABE — sw.js
 * Service worker for PWA offline support.
 * Core files cached on install. Pattern matching works offline always.
 * Note: SW is at /honest-abe/sw.js, so paths are relative to /honest-abe/
 */

const CACHE    = "honest-abe-v2";
const PRECACHE = [
    "/Honest-Abe/",
    "/Honest-Abe/index.html",
    "/Honest-Abe/honest-abe/ethics.js",
    "/Honest-Abe/honest-abe/truth-model.js",
    "/Honest-Abe/honest-abe/hallucination-guard.js",
    "/Honest-Abe/honest-abe/nlp.js",
    "/Honest-Abe/honest-abe/agent.js",
    "/Honest-Abe/honest-abe/adapters/pattern.js",
    "/Honest-Abe/honest-abe/adapters/mlvoca.js",
    "/Honest-Abe/honest-abe/adapters/huggingface.js",
    "/Honest-Abe/honest-abe/adapters/mistral.js",
    "/Honest-Abe/honest-abe/adapters/webllm.js",
    "/Honest-Abe/honest-abe/icons/icon512.png",
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

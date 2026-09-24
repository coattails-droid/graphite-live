// These placeholders are replaced in `vite.config.ts` at build time
const PRECACHE_MANIFEST = [{"url":"/graphite-live/android-chrome-192x192.png"},{"url":"/graphite-live/android-chrome-512x512.png"},{"url":"/graphite-live/apple-touch-icon.png"},{"url":"/graphite-live/assets/SourceCodePro-Regular.ttf-CBOlD63d.woff2"},{"url":"/graphite-live/assets/SourceSansPro-Bold.ttf--6c9oR8J.woff2"},{"url":"/graphite-live/assets/SourceSansPro-BoldIt.ttf-DmM_grLY.woff2"},{"url":"/graphite-live/assets/SourceSansPro-It.ttf-I1ipWe7Q.woff2"},{"url":"/graphite-live/assets/SourceSansPro-Regular.ttf-DZLUzqI4.woff2"},{"url":"/graphite-live/assets/graphite_wasm_wrapper_bg-B03pGRr0.wasm"},{"url":"/graphite-live/assets/index-BYSpzyb3.css"},{"url":"/graphite-live/assets/index-DCcgRWC2.js"},{"url":"/graphite-live/assets/thumbnail-changing-seasons-CoHNVlQC.png"},{"url":"/graphite-live/assets/thumbnail-isometric-fountain-CDgP8pJV.png"},{"url":"/graphite-live/assets/thumbnail-painted-dreams-6cvlf_GW.png"},{"url":"/graphite-live/assets/thumbnail-parametric-dunescape-DHju-lzj.png"},{"url":"/graphite-live/assets/thumbnail-procedural-string-lights-CQUvSG6g.png"},{"url":"/graphite-live/assets/thumbnail-red-dress-C-us8QFK.png"},{"url":"/graphite-live/assets/thumbnail-valley-of-spires-C3MlK86-.png"},{"url":"/graphite-live/browserconfig.xml","revision":"ae0fb8f0e0e2"},{"url":"/graphite-live/favicon-16x16.png","revision":"160b6264a284"},{"url":"/graphite-live/favicon-32x32.png","revision":"bde56f7a48fe"},{"url":"/graphite-live/favicon.ico","revision":"040731ce89ca"},{"url":"/graphite-live/index.html","revision":"81a4c9a54a45"},{"url":"/graphite-live/mstile-144x144.png"},{"url":"/graphite-live/mstile-150x150.png"},{"url":"/graphite-live/mstile-310x150.png"},{"url":"/graphite-live/mstile-310x310.png"},{"url":"/graphite-live/mstile-70x70.png","revision":"e38520c8a388"},{"url":"/graphite-live/safari-pinned-tab.svg"},{"url":"/graphite-live/site.webmanifest","revision":"e70a5a9a97df"}];
const DEFERRED_CACHE_MANIFEST = [{"url":"/graphite-live/demo-artwork/changing-seasons.graphite","revision":"1faf7594318c"},{"url":"/graphite-live/demo-artwork/isometric-fountain.graphite","revision":"21d729d51881"},{"url":"/graphite-live/demo-artwork/marbled-mandelbrot.graphite","revision":"fd220ee6d557"},{"url":"/graphite-live/demo-artwork/painted-dreams.graphite","revision":"bf74f56db528"},{"url":"/graphite-live/demo-artwork/parametric-dunescape.graphite","revision":"ea7e611c4e82"},{"url":"/graphite-live/demo-artwork/procedural-string-lights.graphite","revision":"4f730271e657"},{"url":"/graphite-live/demo-artwork/red-dress.graphite","revision":"8c5ea183fc18"},{"url":"/graphite-live/demo-artwork/valley-of-spires.graphite","revision":"c347c88c8401"},{"url":"/graphite-live/third-party-licenses.txt","revision":"9f50a7835708"}];
const SERVICE_WORKER_CONTENT_HASH = "24ae79d36ea2";
const BASE_PATH = "/graphite-live/";

const STATIC_CACHE_NAME = `static-${SERVICE_WORKER_CONTENT_HASH}`;
const RUNTIME_ASSETS = "runtime-assets";
const RUNTIME_FONTS = "runtime-fonts";

const FONT_LIST_API = "https://api.graphite.art/font-list";

// Build a set of precache URLs for quick lookup during fetch
const PRECACHE_URLS = new Set(PRECACHE_MANIFEST.map((entry) => new URL(entry.url, self.location.origin).href));

// Track deferred manifest URLs and revisions for cache invalidation
const DEFERRED_ENTRIES = new Map(DEFERRED_CACHE_MANIFEST.map((entry) => [new URL(entry.url, self.location.origin).href, entry.revision]));

// ==================
// Caching strategies
// ==================

function isCacheable(response) {
	// Cache normal successful responses and opaque responses (cross-origin no-cors, e.g. <link> stylesheets)
	return response.ok || response.type === "opaque";
}

async function cacheFirst(request, cacheName) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);
	if (cached) return cached;

	const response = await fetch(request);
	if (isCacheable(response)) cache.put(request, response.clone());
	return response;
}

async function networkFirst(request, cacheName) {
	const cache = await caches.open(cacheName);
	try {
		const response = await fetch(request);
		if (isCacheable(response)) cache.put(request, response.clone());
		return response;
	} catch {
		const cached = await cache.match(request);
		if (cached) return cached;
		throw new Error(`Network request failed and no cache available for ${request.url}`);
	}
}

// ================
// Lifecycle events
// ================

self.addEventListener("install", (event) => {
	event.waitUntil(
		(async () => {
			// Precache app shell assets
			const cache = await caches.open(STATIC_CACHE_NAME);
			await Promise.all(
				PRECACHE_MANIFEST.map(async (entry) => {
					const response = await fetch(entry.url);
					if (!response.ok) throw new Error(`Precache fetch failed for ${entry.url}: ${response.status}`);
					// Strip the `redirected` flag which causes errors when served via respondWith
					const cleaned = response.redirected
						? new Response(response.body, {
								status: response.status,
								statusText: response.statusText,
								headers: response.headers,
							})
						: response;
					await cache.put(entry.url, cleaned);
				}),
			);

			// Proactively cache the font catalog API
			try {
				const fontResponse = await fetch(FONT_LIST_API);
				if (fontResponse.ok) {
					const fontCache = await caches.open(RUNTIME_FONTS);
					await fontCache.put(FONT_LIST_API, fontResponse);
				}
			} catch {
				// Font catalog prefetch is best-effort, don't block installation
			}

			await self.skipWaiting();
		})(),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			const cacheNames = await caches.keys();

			// Delete old precache versions
			const deletions = cacheNames.filter((name) => name.startsWith("static-") && name !== STATIC_CACHE_NAME).map((name) => caches.delete(name));
			await Promise.all(deletions);

			// Prune stale deferred (demo artwork) entries
			const assetsCache = await caches.open(RUNTIME_ASSETS);
			const assetsKeys = await assetsCache.keys();
			await Promise.all(assetsKeys.filter((request) => !DEFERRED_ENTRIES.has(request.url)).map((request) => assetsCache.delete(request)));

			await self.clients.claim();
		})(),
	);
});

// =============
// Fetch routing
// =============

self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Pass through range requests (e.g. for large file streaming) and non-GET requests
	if (request.headers.has("range") || request.method !== "GET") return;

	// Pre-cached assets (JS and Wasm bundle files, favicons, index.html)
	if (PRECACHE_URLS.has(url.href)) {
		event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
		return;
	}

	// Deferred-cached assets (demo artwork, third-party licenses, etc.)
	if (DEFERRED_ENTRIES.has(url.href)) {
		event.respondWith(cacheFirst(request, RUNTIME_ASSETS));
		return;
	}

	// Font catalog API: network-first to keep it fresh
	if (url.href.startsWith(FONT_LIST_API)) {
		event.respondWith(networkFirst(request, RUNTIME_FONTS));
		return;
	}

	// Google Fonts CSS (font preview stylesheets): cache-first since responses are stable for a given query
	if (url.hostname === "fonts.googleapis.com") {
		event.respondWith(cacheFirst(request, RUNTIME_FONTS));
		return;
	}

	// Google Fonts static files: cache-first since they are immutable CDN URLs
	if (url.hostname === "fonts.gstatic.com") {
		event.respondWith(cacheFirst(request, RUNTIME_FONTS));
		return;
	}

	// Navigation requests: serve cached index.html for all routes (SPA pattern)
	if (request.mode === "navigate") {
		event.respondWith(
			(async () => {
				const cache = await caches.open(STATIC_CACHE_NAME);
				const cached = await cache.match(`${BASE_PATH}index.html`);
				return cached || fetch(request);
			})(),
		);
		return;
	}

	// Everything else: network-only (no respondWith, let the browser handle it)
});

// ============================
// Deferred caching via message
// ============================

self.addEventListener("message", (event) => {
	if (event.data?.type !== "CACHE_DEFERRED") return;

	event.waitUntil(
		(async () => {
			const cache = await caches.open(RUNTIME_ASSETS);
			const fetchPromises = DEFERRED_CACHE_MANIFEST.map(async (entry) => {
				const fullUrl = new URL(entry.url, self.location.origin).href;

				// Skip if already cached with the same revision
				const existing = await cache.match(fullUrl);
				if (existing?.headers.get("x-sw-revision") === entry.revision) return;

				try {
					const response = await fetch(fullUrl);
					if (response.ok) {
						// Store the service worker revision in a custom header so we can check it on future installs
						const headers = new Headers(response.headers);
						headers.set("x-sw-revision", entry.revision);
						const taggedResponse = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
						await cache.put(fullUrl, taggedResponse);
					}
				} catch {
					// Best-effort: skip files that fail to fetch
				}
			});
			await Promise.all(fetchPromises);
		})(),
	);
});

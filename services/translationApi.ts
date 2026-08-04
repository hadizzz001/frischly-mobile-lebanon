// services/translationApi.ts
//
// Free machine-translation client for DYNAMIC backend text (kitchen names,
// product names, offers, market names, etc.) that isn't covered by the static
// dictionary in utils/dynamicTranslations.ts. Chains through multiple free,
// keyless translation APIs so that if one is rate-limited/down, the next is
// tried automatically:
//
//   1. MyMemory       (api.mymemory.translated.net)
//   2. Lingva Translate (a keyless Google Translate mirror, lingva.ml)
//   3. LibreTranslate  (public de/astian instances)
//
// Results are cached in-memory + persisted to AsyncStorage so we only ever
// hit the network once per unique string, across app restarts.

import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "dynamicTranslationCache_v1";
const FETCH_TIMEOUT_MS = 6000;

type CacheShape = Record<string, Record<string, string>>; // { [lang]: { [text]: translation } }

let cache: CacheShape = {};
let cacheLoaded = false;
let cacheLoadPromise: Promise<void> | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

async function loadCache(): Promise<void> {
	if (cacheLoaded) return;
	if (cacheLoadPromise) return cacheLoadPromise;
	cacheLoadPromise = (async () => {
		try {
			const raw = await AsyncStorage.getItem(CACHE_KEY);
			if (raw) cache = JSON.parse(raw) || {};
		} catch {
			// ignore — start with an empty cache
		} finally {
			cacheLoaded = true;
		}
	})();
	return cacheLoadPromise;
}

function persistCacheSoon(): void {
	if (persistTimer) clearTimeout(persistTimer);
	persistTimer = setTimeout(() => {
		AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache)).catch(() => {
			// best-effort only
		});
	}, 500);
}

function getCached(text: string, targetLang: string): string | undefined {
	return cache[targetLang]?.[text];
}

function setCached(text: string, targetLang: string, translation: string): void {
	if (!cache[targetLang]) cache[targetLang] = {};
	cache[targetLang][text] = translation;
	persistCacheSoon();
}

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	try {
		return await fetch(url, { ...options, signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

// ---- Provider 1: MyMemory (free, no key, ~anonymous daily word quota) ----
async function translateWithMyMemory(text: string, target: string): Promise<string | null> {
	try {
		const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
			text,
		)}&langpair=en|${target}`;
		const res = await fetchWithTimeout(url);
		if (!res.ok) return null;
		const data = await res.json();
		const translated = data?.responseData?.translatedText;
		if (!translated || typeof translated !== "string") return null;
		// MyMemory echoes back an error string inside a 200 response when quota
		// is exceeded — detect and reject that instead of caching garbage.
		if (/MYMEMORY WARNING|QUOTA/i.test(translated)) return null;
		return translated;
	} catch {
		return null;
	}
}

// ---- Provider 2: Lingva Translate (keyless Google Translate mirror) ----
async function translateWithLingva(text: string, target: string): Promise<string | null> {
	try {
		const url = `https://lingva.ml/api/v1/en/${target}/${encodeURIComponent(text)}`;
		const res = await fetchWithTimeout(url);
		if (!res.ok) return null;
		const data = await res.json();
		const translated = data?.translation;
		return typeof translated === "string" && translated ? translated : null;
	} catch {
		return null;
	}
}

// ---- Provider 3: LibreTranslate public instances ----
const LIBRETRANSLATE_HOSTS = [
	"https://libretranslate.de/translate",
	"https://translate.astian.org/translate",
];

async function translateWithLibreTranslate(text: string, target: string): Promise<string | null> {
	for (const host of LIBRETRANSLATE_HOSTS) {
		try {
			const res = await fetchWithTimeout(host, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					q: text,
					source: "en",
					target,
					format: "text",
				}),
			});
			if (!res.ok) continue;
			const data = await res.json();
			const translated = data?.translatedText;
			if (typeof translated === "string" && translated) return translated;
		} catch {
			// try next host
		}
	}
	return null;
}

const providers = [translateWithMyMemory, translateWithLingva, translateWithLibreTranslate];

// Dedup concurrent requests for the exact same string+lang.
const inFlight = new Map<string, Promise<string | null>>();

/**
 * Translate `text` (assumed English source) to `targetLang` using a chain of
 * free translation APIs, falling through to the next provider if one fails
 * or is rate-limited. Returns null if every provider fails (caller should
 * keep showing the original text).
 */
export async function translateText(text: string, targetLang: string): Promise<string | null> {
	if (!text || !text.trim()) return null;

	await loadCache();
	const cached = getCached(text, targetLang);
	if (cached) return cached;

	const dedupeKey = `${targetLang}::${text}`;
	const existing = inFlight.get(dedupeKey);
	if (existing) return existing;

	const promise = (async () => {
		for (const provider of providers) {
			const result = await provider(text, targetLang);
			if (result) {
				setCached(text, targetLang, result);
				return result;
			}
		}
		return null;
	})().finally(() => {
		inFlight.delete(dedupeKey);
	});

	inFlight.set(dedupeKey, promise);
	return promise;
}

export function getCachedTranslation(text: string, targetLang: string): string | undefined {
	return getCached(text, targetLang);
}

// utils/voiceSearch.ts
//
// AI voice-search client. The recorded clip is uploaded to OUR backend
// (POST /api/voice/interpret), which holds the OpenAI key, transcribes the
// clip and interprets it into a structured shopping intent:
//   { transcript, intent: "search" | "open_market", market, terms }
//
// LANGUAGES: English, Modern Standard Arabic and Lebanese/Levantine dialect are
// all understood (including code-switching) — the spoken language is
// auto-detected server-side and never pinned to the app's UI language.
//
// SECURITY: no provider key lives in the app bundle any more, and provider
// error bodies never reach the client — the server answers with a short error
// code which `voiceErrorKey()` turns into a translation key.

import { API_BASE_URL, API_TIMEOUT_MS } from "@/constants/api";
import type { VoiceIntent } from "@/types/utils/voiceSearch.types";

export type { VoiceIntent };

/** Short codes the server (or this client) can produce for a failed request. */
export type VoiceErrorCode =
	| "no_audio"
	| "too_large"
	| "not_configured"
	| "provider_error"
	| "rate_limited"
	| "timeout"
	| "offline"
	| "unknown";

export class VoiceSearchError extends Error {
	code: VoiceErrorCode;
	constructor(code: VoiceErrorCode) {
		super(code);
		this.code = code;
	}
}

/** Translation key for the friendly sentence to show for a failure. */
export function voiceErrorKey(err: unknown): string {
	const code: VoiceErrorCode =
		err instanceof VoiceSearchError ? err.code : "unknown";
	switch (code) {
		case "offline":
		case "timeout":
			return "voiceOffline";
		case "rate_limited":
			return "voiceServiceBusy";
		case "too_large":
			return "voiceTooLong";
		case "no_audio":
			return "voiceNoSpeech";
		case "not_configured":
		case "provider_error":
		case "unknown":
		default:
			// The spec'd customer-friendly copy: never a raw status or JSON body.
			return "voiceUnclear";
	}
}

/** Multipart file descriptor React Native's fetch expects for an audio upload. */
function buildAudioFile(uri: string): { uri: string; name: string; type: string } {
	const ext = (uri.split(".").pop() || "m4a").split("?")[0].toLowerCase();
	const mime =
		ext === "wav"
			? "audio/wav"
			: ext === "mp3"
			? "audio/mpeg"
			: ext === "webm"
			? "audio/webm"
			: ext === "caf"
			? "audio/x-caf"
			: "audio/m4a";
	return { uri, name: `voice-search.${ext}`, type: mime };
}

const KNOWN_CODES: VoiceErrorCode[] = [
	"no_audio",
	"too_large",
	"not_configured",
	"provider_error",
	"rate_limited",
	"timeout",
];

/**
 * Full pipeline: audio uri -> { transcript, intent, market, terms }.
 * Throws a VoiceSearchError with a short code on any failure.
 */
export async function processVoiceQuery(uri: string): Promise<{
	transcript: string;
	intent: VoiceIntent["intent"];
	market: string;
	terms: string[];
}> {
	if (!uri) throw new VoiceSearchError("no_audio");

	const form = new FormData();
	form.append("audio", buildAudioFile(uri) as unknown as Blob);

	const controller = new AbortController();
	// Transcription + interpretation can take a while on a long clip.
	const timer = setTimeout(() => controller.abort(), Math.max(API_TIMEOUT_MS, 35000));

	let res: Response;
	try {
		res = await fetch(`${API_BASE_URL}/voice/interpret`, {
			method: "POST",
			// No Content-Type: fetch sets the multipart boundary for FormData.
			body: form,
			signal: controller.signal,
		});
	} catch (err) {
		if ((err as Error)?.name === "AbortError") throw new VoiceSearchError("timeout");
		throw new VoiceSearchError("offline");
	} finally {
		clearTimeout(timer);
	}

	let json: { success?: boolean; message?: string; data?: unknown } = {};
	try {
		json = await res.json();
	} catch {
		json = {};
	}

	if (!res.ok || !json?.success) {
		const message = String(json?.message || "");
		const code = KNOWN_CODES.find((c) => c === message);
		// Anything unrecognised (HTML error page, 5xx text…) is deliberately
		// collapsed to a generic code — the shopper never sees raw detail.
		throw new VoiceSearchError(code || (res.status === 429 ? "rate_limited" : "provider_error"));
	}

	const data = (json.data || {}) as {
		transcript?: string;
		intent?: string;
		market?: string;
		items?: unknown;
	};
	const terms = Array.isArray(data.items)
		? data.items.map((x) => String(x || "").trim()).filter(Boolean)
		: [];
	const intent: VoiceIntent["intent"] =
		data.intent === "open_market" ? "open_market" : "search";

	return {
		transcript: String(data.transcript || "").trim(),
		intent,
		market: String(data.market || "").trim(),
		terms,
	};
}

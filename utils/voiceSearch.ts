// utils/voiceSearch.ts
//
// AI voice-search brain. Turns a recorded clip into a structured shopping
// intent in two fast OpenAI calls:
//   1. Speech-to-text  -> transcribes what the shopper said, in ANY language.
//   2. Interpreter     -> understands what they MEAN and returns short ENGLISH
//      search keywords, translating from Arabic / Lebanese automatically.
//
// LANGUAGES: English, Modern Standard Arabic and Lebanese / Levantine spoken
// dialect are all understood natively, including sentences that code-switch
// between Arabic, English and French ("بدي chips و merci"). The spoken language
// is auto-detected — it is never pinned to the app's UI language, because a
// shopper browsing in English may still speak Lebanese.
//
// This module is AI-ONLY on purpose: there is no offline dictionary fallback.
// If the AI cannot be reached the call throws, and the UI shows a friendly
// message instead of silently returning lower-quality guesses.
//
// SECURITY NOTE: EXPO_PUBLIC_* values are bundled into the published app, so the
// raw OpenAI key would ship with it. For production, run these requests through
// your own backend and point EXPO_PUBLIC_OPENAI_BASE_URL at that proxy instead.

import type { VoiceIntent } from "@/types/utils/voiceSearch.types";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";
const OPENAI_BASE_URL = (
	process.env.EXPO_PUBLIC_OPENAI_BASE_URL || "https://api.openai.com/v1"
).replace(/\/+$/, "");

// Speech-to-text. gpt-4o-transcribe is markedly better than whisper-1 at
// Lebanese dialect and at Arabic/English code-switching, so it is the default.
const TRANSCRIBE_MODEL =
	process.env.EXPO_PUBLIC_OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe";
// Used automatically if the account can't access the model above.
const TRANSCRIBE_FALLBACK_MODEL = "whisper-1";

// Interpreter. gpt-4o-mini answers this task in a fraction of the time of
// gpt-4o with the same accuracy (it is translation + expansion, not hard
// reasoning), which is what makes the whole flow feel instant. Override with
// EXPO_PUBLIC_OPENAI_EXTRACT_MODEL=gpt-4o if you ever want the larger model.
const EXTRACT_MODEL =
	process.env.EXPO_PUBLIC_OPENAI_EXTRACT_MODEL || "gpt-4o-mini";

// Never let a hung request keep the shopper waiting.
const TRANSCRIBE_TIMEOUT_MS = 20000;
const EXTRACT_TIMEOUT_MS = 12000;

// Structured result of interpreting what the shopper said.
export type { VoiceIntent };

/**
 * fetch + a hard timeout. Aborts the request and throws a message that the UI's
 * error mapper recognises as a network problem.
 */
async function fetchWithTimeout(
	url: string,
	options: RequestInit,
	timeoutMs: number,
): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { ...options, signal: controller.signal });
	} catch (err) {
		// An abort surfaces as an AbortError — report it as a timeout so the
		// caller shows the "check your connection" message.
		if ((err as Error)?.name === "AbortError") {
			throw new Error("Request timed out.");
		}
		throw err;
	} finally {
		clearTimeout(timer);
	}
}

// Speech-to-text vocabulary bias. This is sent with EVERY transcription
// regardless of the app's UI language, because the UI language does not predict
// what the shopper actually speaks — someone browsing in English will still say
// "بدي كيلو بندورة". Priming the model with both Lebanese and English grocery
// vocabulary in one hint is what makes dialect recognition reliable, and it also
// stops short words being misheard ("hot dog" -> "not bad").
//
// Spoken Lebanese mixes Arabic, French and English ("bonjour", "merci",
// "chips") and uses dialect verbs that differ from Modern Standard Arabic
// (بدي / جيبلي instead of أريد), so those forms are listed explicitly.
const SPEECH_HINT =
	"Supermarket voice shopping in Lebanon. The shopper speaks English, Arabic or " +
	"Lebanese/Levantine dialect, often mixing all three in one sentence. " +
	"Lebanese requests: بدي، بدنا، جيبلي، عطيني، لزمني، ناولني، رح آخد، شو في، شوي، " +
	"كتير، كيلو، نص كيلو، ربطة، علبة، قنينة، كيس. " +
	"Lebanese products: لبنة، لبن، جبنة بيضا، شنكليش، زعتر، زيت زيتون، خبز مرقوق، كعك، " +
	"معمول، برغل، فريكة، عدس، حمص، فول، طحينة، دبس رمان، كزبرة، بقدونس، نعنع، بندورة، " +
	"خيار، باذنجان، كوسا، بطاطا، بصل، ثوم، ليمون حامض، دجاج، لحمة، كفتة، مقانق، سمك، " +
	"بيض، حليب، مي، عصير، غازوز، قهوة، شاي، سكر، ملح، رز، مكرونة، شيبس، شوكولا، " +
	"صابون جلي، كلور، شامبو، حفاضات، مناديل. " +
	"Lebanese dishes: تبولة، فتوش، حمص، مجدرة، ملوخية، كبة، منقوشة، ورق عنب، مقلوبة، شاورما. " +
	"English products: hot dog, sausage, ketchup, mustard, cheese, milk, eggs, bread, " +
	"chicken, beef, rice, pasta, pizza, water, juice, soda, chips, coffee, tea, " +
	"dish soap, detergent, floor cleaner, bleach, sponge, paper towel, shampoo, " +
	"toothpaste, diapers, pen, notebook. " +
	"Or asking to open a store: 'go to', روح على، فوت على، وديني على.";

// Common speech-to-text mishearings of food words -> the intended product.
const MISHEARD_FIXES: [RegExp, string][] = [
	[/\bnot bad\b/gi, "hot dog"],
	[/\bhot bog\b/gi, "hot dog"],
	[/\bhot dogs\b/gi, "hot dog"],
	[/\bcatch up\b/gi, "ketchup"],
	[/\bketch up\b/gi, "ketchup"],
	[/\bmayo\b/gi, "mayonnaise"],
];

/** Repair obvious food mishearings before we extract search terms. */
function correctMishearings(text: string): string {
	let out = ` ${String(text || "")} `;
	for (const [re, replacement] of MISHEARD_FIXES) out = out.replace(re, replacement);
	return out.replace(/\s+/g, " ").trim();
}

export function hasOpenAIKey(): boolean {
	return Boolean(OPENAI_API_KEY);
}

/**
 * Builds the multipart file descriptor React Native's fetch expects for an audio
 * upload, deriving the name/mime type from the recording uri extension.
 */
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

/**
 * Send the recorded clip to OpenAI and return the transcribed text.
 *
 * IMPORTANT: the spoken language is AUTO-DETECTED. We deliberately do NOT pin
 * the request to the app's UI language, because a shopper browsing the app in
 * English may still speak Lebanese Arabic — forcing `language: "en"` made the
 * model try to render Arabic speech as English words, producing gibberish.
 * Auto-detection handles Arabic, Lebanese dialect, English and code-switching
 * between them in a single sentence.
 *
 * @param {string} uri Local file uri of the recording.
 */
export async function transcribeAudio(uri: string): Promise<string> {
	if (!uri) throw new Error("No recording was captured.");
	if (!OPENAI_API_KEY) {
		throw new Error(
			"Missing OpenAI API key. Set EXPO_PUBLIC_OPENAI_API_KEY in your .env."
		);
	}

	// Try the stronger model first, then fall back to whisper-1 if the account
	// can't use it (404/403/400 on the model name).
	const attempt = async (model: string): Promise<Response> => {
		const form = new FormData();
		form.append("file", buildAudioFile(uri) as unknown as Blob);
		form.append("model", model);
		form.append("response_format", "json");
		// One bilingual hint for everyone — see SPEECH_HINT.
		form.append("prompt", SPEECH_HINT);
		// Keep it deterministic.
		form.append("temperature", "0");
		// NOTE: no `language` field on purpose — see the doc comment above.

		return fetchWithTimeout(
			`${OPENAI_BASE_URL}/audio/transcriptions`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${OPENAI_API_KEY}`,
					// NOTE: do NOT set Content-Type manually; fetch adds the multipart
					// boundary automatically for FormData.
				},
				body: form,
			},
			TRANSCRIBE_TIMEOUT_MS,
		);
	};

	let res = await attempt(TRANSCRIBE_MODEL);

	// Model not available on this account/plan -> retry with the classic model.
	if (!res.ok && [400, 403, 404].includes(res.status)) {
		console.warn(
			`transcribeAudio: ${TRANSCRIBE_MODEL} unavailable (${res.status}), retrying with ${TRANSCRIBE_FALLBACK_MODEL}`
		);
		res = await attempt(TRANSCRIBE_FALLBACK_MODEL);
	}

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(`Transcription failed (${res.status}). ${detail}`.trim());
	}

	const json = await res.json();
	return (json?.text || "").trim();
}

// The interpreter's instructions. Kept dense and high-signal on purpose: every
// token here is re-sent on each request, so a tight prompt is a faster prompt.
const SYSTEM_PROMPT =
	"You are the voice-shopping brain for a Lebanese grocery delivery app that " +
	"sells EVERY department: food, drinks, dairy, meat, produce, bakery, frozen, " +
	"pantry, AND non-food — cleaning, household, paper goods, hygiene, personal " +
	"care, baby, pet, office/stationery. It also has partner MARKETS openable by name.\n\n" +
	"LANGUAGES: You natively understand English, Modern Standard Arabic and " +
	"LEBANESE/LEVANTINE spoken dialect, including sentences that mix Arabic, " +
	"English and French. Whatever is spoken, you ALWAYS output ENGLISH keywords.\n" +
	"Lebanese for 'I want / give me': بدي بدنا جيبلي جيب لي عطيني عطينا لزمني ناولني رح آخد إجبلي.\n" +
	"Lebanese for 'go to a store': روح على، فوت على، وديني على، خدني على، افتح.\n" +
	"Quantity/filler words to DROP: كيلو، نص كيلو، ربطة، علبة، قنينة، كيس، شوي، كتير، حبة، دزينة.\n" +
	"Sample translations: لبنة labneh, جبنة بيضا white cheese, خبز مرقوق markouk bread, " +
	"كزبرة coriander, بقدونس parsley, بندورة tomato, باذنجان eggplant, كوسا zucchini, " +
	"بطاطا potato, بصل onion, ليمون حامض lemon, لحمة beef, دجاج chicken, مقانق sausage, " +
	"مي water, غازوز soda, دبس رمان pomegranate molasses, برغل bulgur, طحينة tahini, " +
	"صابون جلي dish soap, كلور bleach, حفاضات diapers.\n\n" +
	'Reply with STRICT JSON only: {"intent":"search"|"open_market","market":string,"items":string[]}\n\n' +
	'"open_market" — they want to GO TO / OPEN / VISIT a named store. Put the name in ' +
	'"market" (Latin letters, transliterate if spoken in Arabic), leave "items" empty.\n\n' +
	'"search" — they want products. Leave "market" empty, fill "items" (max 8, most ' +
	"relevant first):\n" +
	"- Named products -> return them, translated to English.\n" +
	"- A dish/recipe/meal -> its 4-8 key ingredients. Know Lebanese dishes: تبولة، فتوش، " +
	"حمص، فلافل، مجدرة، ملوخية، كبة، منقوشة، ورق عنب، مقلوبة، شاورما، فتة، صيادية، مسخن.\n" +
	"- An occasion (barbecue, breakfast, cleaning the house, back to school) -> the " +
	"products people typically buy for it, from ANY department.\n" +
	"- A single product -> add a few closely related items so the whole section shows " +
	"(e.g. 'hot dog' -> hot dog, sausage, hot dog buns, ketchup, mustard).\n" +
	"- Each item: 1-3 words, lowercase, singular, ENGLISH. Keep brand names. Drop " +
	"quantities, units, price and quality words.\n" +
	"- Fix obvious speech-to-text mishearings to the most likely real product, including " +
	"Arabic words mis-transcribed into English.\n" +
	"- Never refuse a non-food request.\n" +
	'- Nothing shoppable said -> {"intent":"search","market":"","items":[]}.';

// A few worked examples cover far more ground than extra prose: Lebanese
// products with quantities, a Lebanese dish, Lebanese store navigation,
// code-switching, and a non-food request.
const FEW_SHOTS: { role: "user" | "assistant"; content: string }[] = [
	{ role: "user", content: "بدي كيلو بندورة وخيار وشوي لبنة" },
	{
		role: "assistant",
		content: '{"intent":"search","market":"","items":["tomato","cucumber","labneh"]}',
	},
	{ role: "user", content: "بدي اعمل تبولة" },
	{
		role: "assistant",
		content:
			'{"intent":"search","market":"","items":["parsley","bulgur","tomato","onion","lemon","olive oil","mint"]}',
	},
	{ role: "user", content: "روح على سبينيس" },
	{
		role: "assistant",
		content: '{"intent":"open_market","market":"Spinneys","items":[]}',
	},
	{ role: "user", content: "جيبلي chips و شوكولا ومي" },
	{
		role: "assistant",
		content: '{"intent":"search","market":"","items":["chips","chocolate","water"]}',
	},
	{ role: "user", content: "I need cleaning stuff for the kitchen" },
	{
		role: "assistant",
		content:
			'{"intent":"search","market":"","items":["dish soap","floor cleaner","sponge","paper towel","surface cleaner","garbage bags"]}',
	},
];

/**
 * Smart interpreter: understands what the shopper wants from a free-form
 * sentence and returns a structured intent:
 *   { intent: "search" | "open_market", market: string, items: string[] }
 * - "open_market": they asked to go to / open a specific store (the caller then
 *   navigates there).
 * - "search": they want products from ANY department — food, drinks, cleaning,
 *   household, hygiene, office, baby, pet, etc. `items` holds the keywords.
 *
 * AI-only: any failure throws so the UI can show a friendly message, rather than
 * quietly returning weaker offline guesses.
 */
export async function interpretTranscript(
	transcript: string,
): Promise<VoiceIntent> {
	const clean = correctMishearings((transcript || "").trim());
	if (!clean) return { intent: "search", market: "", items: [] };

	if (!OPENAI_API_KEY) {
		throw new Error(
			"Missing OpenAI API key. Set EXPO_PUBLIC_OPENAI_API_KEY in your .env."
		);
	}

	const body = {
		model: EXTRACT_MODEL,
		// Deterministic and short: both make the response arrive sooner.
		temperature: 0,
		max_tokens: 200,
		response_format: { type: "json_object" },
		messages: [
			{ role: "system", content: SYSTEM_PROMPT },
			...FEW_SHOTS,
			{ role: "user", content: clean },
		],
	};

	const res = await fetchWithTimeout(
		`${OPENAI_BASE_URL}/chat/completions`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		},
		EXTRACT_TIMEOUT_MS,
	);

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(`Interpretation failed (${res.status}). ${detail}`.trim());
	}

	const json = await res.json();
	const content = json?.choices?.[0]?.message?.content || "{}";

	let parsed: { intent?: string; market?: unknown; items?: unknown };
	try {
		parsed = JSON.parse(content);
	} catch {
		// response_format guarantees JSON, so this is vanishingly rare — but never
		// crash the shopper's search over it.
		console.warn("interpretTranscript: unparseable model output:", content);
		return { intent: "search", market: "", items: [] };
	}

	const market = typeof parsed?.market === "string" ? parsed.market.trim() : "";
	const items = Array.isArray(parsed?.items) ? normaliseTerms(parsed.items) : [];

	if (parsed?.intent === "open_market" && market) {
		return { intent: "open_market", market, items: [] };
	}
	return { intent: "search", market: "", items };
}

/** Backward-compatible helper: returns just the product search keywords. */
export async function extractSearchTerms(transcript: string): Promise<string[]> {
	const { items } = await interpretTranscript(transcript);
	return items;
}

/**
 * Full pipeline: audio uri -> { transcript, intent, market, terms }.
 *
 * Two sequential AI calls: speech-to-text, then interpretation. The spoken
 * language is auto-detected, so Arabic / Lebanese / English all work without the
 * caller having to say which one to expect.
 */
export async function processVoiceQuery(
	uri: string,
): Promise<{
	transcript: string;
	intent: VoiceIntent["intent"];
	market: string;
	terms: string[];
}> {
	const transcript = await transcribeAudio(uri);
	const { intent, market, items } = await interpretTranscript(transcript);
	return { transcript, intent, market, terms: items };
}

/** Tidy, de-duplicate and cap the extracted keywords. */
function normaliseTerms(items: unknown[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const raw of items) {
		const term = String(raw || "")
			.toLowerCase()
			.replace(/[^\p{L}\p{N}\s-]/gu, "")
			.trim();
		if (term && !seen.has(term)) {
			seen.add(term);
			out.push(term);
		}
	}
	return out.slice(0, 10); // keep the request count sane
}

// utils/voiceSearch.js
//
// Voice-search AI helper. Turns a recorded audio clip into a list of product
// search terms using OpenAI:
//   1. Whisper  (speech-to-text)      -> transcribes what the user said.
//   2. GPT      (smart item extractor) -> understands what the shopper MEANS and
//      returns the products to show. It pulls out named items ("ketchup and cheap
//      potato" -> ketchup, potato) AND reasons about dishes / meals / occasions,
//      expanding them into the ingredients to buy ("I want to make a pizza" ->
//      pizza dough, mozzarella, tomato sauce, pepperoni, basil...). Results are
//      short English search keywords.
//
// A fallback is used when the GPT step is unavailable so the feature still works:
// it expands a built-in dish dictionary (pizza, burger, tabbouleh, ...) and splits
// the rest on "and"/commas while removing common filler words.
//
// SECURITY NOTE: EXPO_PUBLIC_* values are bundled into the published app, so the
// raw OpenAI key would ship with it. For production, run these requests through
// your own backend and point EXPO_PUBLIC_OPENAI_BASE_URL at that proxy instead.

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";
const OPENAI_BASE_URL = (
	process.env.EXPO_PUBLIC_OPENAI_BASE_URL || "https://api.openai.com/v1"
).replace(/\/+$/, "");

const TRANSCRIBE_MODEL = "whisper-1";
const EXTRACT_MODEL = "gpt-4o-mini";

// Structured result of interpreting what the shopper said.
export type VoiceIntent = {
	intent: "search" | "open_market";
	market: string;
	items: string[];
};

// Words we strip out in the offline fallback parser (price / quantity / filler).
const FILLER_WORDS = new Set([
	"i", "want", "need", "would", "like", "get", "buy", "me", "some", "a", "an",
	"the", "and", "or", "with", "of", "please", "also", "to", "for", "my", "give",
	"cheap", "cheapest", "expensive", "fresh", "good", "best", "few", "lot", "lots",
	"more", "little", "bit", "kg", "kilo", "kilos", "gram", "grams", "piece",
	"pieces", "pack", "packs", "bottle", "bottles", "can", "cans", "box", "boxes",
	// Cooking-intent words so "I want to make a pizza" reduces to "pizza".
	"make", "making", "made", "cook", "cooking", "prepare", "preparing", "eat",
	"eating", "have", "having", "tonight", "today", "tomorrow", "dinner", "lunch",
	"meal", "recipe", "something", "going", "gonna", "wanna", "do",
	// Arabic filler / connectors
	"بدي", "اريد", "أريد", "عايز", "ابغى", "و", "مع", "من", "كمان", "شوي", "رخيص",
	"رخيصة", "كيلو", "غرام", "اعمل", "اطبخ", "بدنا", "نعمل",
]);

// Built-in "recipe brain" for the offline fallback: common dishes / meals mapped
// to the grocery ingredients a shopper needs. Keys are matched as whole words in
// the transcript. The GPT path reasons about far more than this; this just keeps
// the feature smart when GPT is unavailable.
const RECIPE_INGREDIENTS: Record<string, string[]> = {
	pizza: ["pizza dough", "mozzarella", "tomato sauce", "pepperoni", "basil", "olive oil"],
	burger: ["burger buns", "ground beef", "cheddar", "lettuce", "tomato", "ketchup", "onion"],
	hamburger: ["burger buns", "ground beef", "cheddar", "lettuce", "tomato", "ketchup", "onion"],
	pasta: ["pasta", "tomato sauce", "parmesan", "garlic", "olive oil", "basil"],
	spaghetti: ["spaghetti", "tomato sauce", "ground beef", "parmesan", "garlic", "onion"],
	lasagna: ["lasagna sheets", "ground beef", "tomato sauce", "mozzarella", "parmesan", "onion"],
	salad: ["lettuce", "tomato", "cucumber", "onion", "olive oil", "lemon"],
	tabbouleh: ["parsley", "bulgur", "tomato", "onion", "lemon", "olive oil", "mint"],
	fattoush: ["lettuce", "tomato", "cucumber", "pita bread", "sumac", "olive oil", "lemon"],
	hummus: ["chickpeas", "tahini", "lemon", "garlic", "olive oil"],
	falafel: ["chickpeas", "garlic", "onion", "parsley", "cumin", "tahini"],
	shawarma: ["chicken", "garlic", "pita bread", "pickles", "tahini", "tomato"],
	manakish: ["flour", "zaatar", "olive oil", "cheese"],
	sandwich: ["bread", "cheese", "ham", "lettuce", "tomato", "mayonnaise"],
	omelette: ["eggs", "milk", "cheese", "onion", "butter"],
	omelet: ["eggs", "milk", "cheese", "onion", "butter"],
	breakfast: ["eggs", "bread", "milk", "butter", "cheese", "jam"],
	pancake: ["flour", "eggs", "milk", "sugar", "butter", "baking powder"],
	pancakes: ["flour", "eggs", "milk", "sugar", "butter", "baking powder"],
	cake: ["flour", "sugar", "eggs", "butter", "baking powder", "vanilla"],
	taco: ["tortilla", "ground beef", "cheddar", "lettuce", "tomato", "salsa"],
	tacos: ["tortilla", "ground beef", "cheddar", "lettuce", "tomato", "salsa"],
	sushi: ["sushi rice", "nori", "salmon", "soy sauce", "avocado", "cucumber"],
	guacamole: ["avocado", "lime", "tomato", "onion", "cilantro"],
	smoothie: ["banana", "strawberry", "yogurt", "milk", "honey"],
	curry: ["chicken", "curry powder", "onion", "garlic", "coconut milk", "rice"],
	soup: ["onion", "carrot", "celery", "potato", "chicken stock"],
	bbq: ["chicken", "beef", "charcoal", "barbecue sauce", "buns", "corn"],
	barbecue: ["chicken", "beef", "charcoal", "barbecue sauce", "buns", "corn"],
	"french fries": ["potato", "vegetable oil", "salt", "ketchup"],
	fries: ["potato", "vegetable oil", "salt", "ketchup"],
	"hot dog": ["hot dog", "sausage", "hot dog buns", "ketchup", "mustard"],
	hotdog: ["hot dog", "sausage", "hot dog buns", "ketchup", "mustard"],
	nachos: ["tortilla chips", "cheddar", "salsa", "jalapeno", "guacamole"],
	"ice cream": ["ice cream", "cone", "chocolate sauce", "sprinkles"],
};

// Whisper transcription bias: a short supermarket vocabulary so single words
// (e.g. "hot dog") aren't misheard ("not bad"), covering every department plus
// store navigation. The hint should be in the spoken language for best effect.
const FOOD_PROMPT_EN =
	"Supermarket voice shopping. The shopper names products, brands, dishes or a " +
	"store to open, such as: hot dog, sausage, ketchup, mustard, cheese, milk, " +
	"eggs, bread, chicken, beef, rice, pasta, pizza, water, juice, soda, chips, " +
	"coffee, tea, dish soap, detergent, floor cleaner, bleach, sponge, paper " +
	"towel, shampoo, toothpaste, diapers, pen, notebook; or 'go to' a market.";
const FOOD_PROMPT_AR =
	"تسوّق سوبرماركت بالصوت. يذكر المتسوّق منتجات أو متجراً يريد فتحه، مثل: هوت دوغ، " +
	"نقانق، كاتشب، خردل، جبنة، حليب، بيض، خبز، دجاج، لحم، أرز، معكرونة، بيتزا، ماء، عصير، " +
	"شيبس، قهوة، شاي، صابون جلي، منظفات، منظف أرضيات، كلور، إسفنج، مناديل ورقية، " +
	"شامبو، معجون أسنان، حفاضات، قلم، دفتر؛ أو 'روح على' متجر.";

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
 * Send the recorded clip to OpenAI Whisper and return the transcribed text.
 * @param {string} uri Local file uri of the recording.
 * @param {string} [language] Optional ISO-639-1 hint ("en", "ar"). Whisper auto
 *   detects when omitted.
 */
export async function transcribeAudio(
	uri: string,
	language?: string,
): Promise<string> {
	if (!uri) throw new Error("No recording was captured.");
	if (!OPENAI_API_KEY) {
		throw new Error(
			"Missing OpenAI API key. Set EXPO_PUBLIC_OPENAI_API_KEY in your .env."
		);
	}

	const form = new FormData();
	form.append("file", buildAudioFile(uri) as unknown as Blob);
	form.append("model", TRANSCRIBE_MODEL);
	form.append("response_format", "json");
	// Bias Whisper toward grocery / food vocabulary so short words like "hot dog"
	// aren't misheard as "not bad", and keep it deterministic (temperature 0).
	const isArabic = String(language || "").toLowerCase().startsWith("ar");
	form.append("prompt", isArabic ? FOOD_PROMPT_AR : FOOD_PROMPT_EN);
	form.append("temperature", "0");
	if (language) form.append("language", language);

	const res = await fetch(`${OPENAI_BASE_URL}/audio/transcriptions`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${OPENAI_API_KEY}`,
			// NOTE: do NOT set Content-Type manually; fetch adds the multipart
			// boundary automatically for FormData.
		},
		body: form,
	});

	if (!res.ok) {
		const detail = await res.text().catch(() => "");
		throw new Error(`Transcription failed (${res.status}). ${detail}`.trim());
	}

	const json = await res.json();
	return (json?.text || "").trim();
}

/**
 * Ask GPT to extract the list of grocery items from a free-form sentence and
 * return them as short English search keywords.
 * @param {string} transcript
 * @returns {Promise<string[]>}
 */
/**
 * Smart interpreter: understands what the shopper wants from a free-form
 * sentence and returns a structured intent:
 *   { intent: "search" | "open_market", market: string, items: string[] }
 * - "open_market": they asked to go to / open a specific store (the caller then
 *   navigates there).
 * - "search": they want products from ANY department — food, drinks, cleaning,
 *   household, hygiene, office, baby, pet, etc. `items` holds the keywords.
 */
export async function interpretTranscript(
	transcript: string,
): Promise<VoiceIntent> {
	const clean = correctMishearings((transcript || "").trim());
	if (!clean) return { intent: "search", market: "", items: [] };

	// Fallback path when no key is configured.
	if (!OPENAI_API_KEY) return fallbackInterpret(clean);

	const body = {
		model: EXTRACT_MODEL,
		temperature: 0.2,
		response_format: { type: "json_object" },
		messages: [
			{
				role: "system",
				content:
					"You are a smart assistant for a supermarket / grocery delivery app. " +
					"The app sells EVERY department: food, drinks, snacks, dairy, meat, " +
					"produce, bakery, frozen and pantry, AND non-food such as cleaning " +
					"supplies, household, paper goods, hygiene, personal care, baby, pet, " +
					"and office / stationery. The app also has several partner MARKETS " +
					"(stores) the shopper can open by name.\n\n" +
					"Decide the shopper's INTENT and respond with strict JSON shaped as " +
					'{"intent":"search"|"open_market","market":string,"items":string[]}.\n\n' +
					"INTENT open_market: the shopper wants to GO TO / OPEN / VISIT a specific " +
					"store or market (e.g. 'go to Spinneys', 'open Carrefour', 'take me to the " +
					"bakery shop'). Put the store name in \"market\" and leave \"items\" empty.\n\n" +
					"INTENT search: the shopper wants products. Leave \"market\" empty and fill " +
					"\"items\" using these rules:\n" +
					"- Specific products named -> return them.\n" +
					"- A dish / recipe / meal -> return its ingredients (4-8, most important first).\n" +
					"- An occasion (barbecue, breakfast, cleaning the house, back to school) -> " +
					"return the typical products people buy for it, from ANY department.\n" +
					"- A single product -> also add a few closely related items so they see the " +
					"whole section (e.g. 'hot dog' -> hot dog, sausage, hot dog buns, ketchup, " +
					"mustard; 'floor cleaner' -> floor cleaner, detergent, mop, sponge, gloves).\n" +
					"- Each item: short keyword 1-3 words, singular, lowercase, English; translate " +
					"non-English names; drop quantities, units and price/quality words; keep brands.\n" +
					"- Correct obvious speech-to-text mishearings to the most likely product.\n" +
					"- Return products from WHATEVER department was asked — food OR cleaning, " +
					"household, hygiene, office, etc. Never refuse a non-food request.\n" +
					"- If nothing shoppable is said, use intent \"search\" with an empty items array.",
			},
			{ role: "user", content: "go to Spinneys" },
			{
				role: "assistant",
				content: '{"intent":"open_market","market":"Spinneys","items":[]}',
			},
			{ role: "user", content: "I want to make a pizza" },
			{
				role: "assistant",
				content:
					'{"intent":"search","market":"","items":["pizza dough","mozzarella","tomato sauce","pepperoni","basil","olive oil"]}',
			},
			{ role: "user", content: "get me ketchup and some cheap potatoes" },
			{
				role: "assistant",
				content: '{"intent":"search","market":"","items":["ketchup","potato"]}',
			},
			{ role: "user", content: "I need cleaning stuff for the kitchen" },
			{
				role: "assistant",
				content:
					'{"intent":"search","market":"","items":["dish soap","floor cleaner","sponge","paper towel","surface cleaner","garbage bags"]}',
			},
			{ role: "user", content: "office supplies" },
			{
				role: "assistant",
				content:
					'{"intent":"search","market":"","items":["pen","notebook","stapler","printer paper","marker","folder"]}',
			},
			{ role: "user", content: clean },
		],
	};

	try {
		const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!res.ok) {
			console.warn("interpretTranscript: GPT call failed", res.status);
			return fallbackInterpret(clean);
		}

		const json = await res.json();
		const content = json?.choices?.[0]?.message?.content || "{}";
		const parsed = JSON.parse(content);
		const market =
			typeof parsed?.market === "string" ? parsed.market.trim() : "";
		const items = Array.isArray(parsed?.items)
			? normaliseTerms(parsed.items)
			: [];
		if (parsed?.intent === "open_market" && market) {
			return { intent: "open_market", market, items: [] };
		}
		return { intent: "search", market: "", items };
	} catch (err) {
		console.warn("interpretTranscript error, using fallback:", (err as Error)?.message);
		return fallbackInterpret(clean);
	}
}

/** Backward-compatible helper: returns just the product search keywords. */
export async function extractSearchTerms(transcript: string): Promise<string[]> {
	const { items } = await interpretTranscript(transcript);
	return items;
}

/**
 * Full pipeline: audio uri -> { transcript, intent, market, terms }.
 */
export async function processVoiceQuery(
	uri: string,
	language?: string,
): Promise<{ transcript: string; intent: VoiceIntent["intent"]; market: string; terms: string[] }> {
	const transcript = await transcribeAudio(uri, language);
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

/**
 * Detect known dishes / meals in the text and return their ingredient lists, plus
 * the set of matched dish words (so the caller can drop them from the raw keyword
 * extraction). Lets the offline fallback mimic the smart GPT path.
 */
function expandRecipes(text: string): { ingredients: string[]; matched: Set<string> } {
	const padded = ` ${String(text || "").toLowerCase()} `;
	const ingredients: string[] = [];
	const matched = new Set<string>();
	for (const dish of Object.keys(RECIPE_INGREDIENTS)) {
		const re = new RegExp(`\\b${dish.replace(/\s+/g, "\\s+")}\\b`, "i");
		if (re.test(padded)) {
			ingredients.push(...RECIPE_INGREDIENTS[dish]);
			dish.split(/\s+/).forEach((w) => matched.add(w));
		}
	}
	return { ingredients, matched };
}

/**
 * Offline keyword extractor used when GPT is unavailable. First expands any known
 * dish into its ingredients (so "I want to make a pizza" still returns pizza
 * dough, cheese, sauce...), then splits the rest on connectors / punctuation and
 * removes common filler words.
 */
export function fallbackExtractTerms(transcript: string): string[] {
	const text = correctMishearings(String(transcript || "")).toLowerCase();

	// Smart expansion: turn mentioned dishes / meals into their ingredients.
	const { ingredients, matched } = expandRecipes(text);

	const chunks = text.split(/\band\b|\bو\b|,|\.|;|\n|\+|&/g);
	const terms = chunks
		.map((chunk) =>
			chunk
				.split(/\s+/)
				.map((w) => w.replace(/[^\p{L}\p{N}-]/gu, ""))
				.filter((w) => w && !FILLER_WORDS.has(w) && !matched.has(w))
				.join(" ")
				.trim()
		)
		.filter(Boolean);

	return normaliseTerms([...ingredients, ...terms]);
}

/**
 * Offline interpreter used when GPT is unavailable. Detects a "go to <store>"
 * style command, otherwise extracts product keywords. Returns the same shape as
 * interpretTranscript: { intent, market, items }.
 */
export function fallbackInterpret(transcript: string): VoiceIntent {
	const clean = correctMishearings(String(transcript || "")).trim();

	// English + basic Arabic navigation phrases ("go to / open / take me to ...").
	const navEn = clean.match(
		/\b(?:go to|goto|open|take me to|bring me to|navigate to|visit)\s+(?:the\s+)?(.+)$/i
	);
	const navAr = clean.match(
		/(?:روح|رح|ودّيني|وديني|خذني|افتح)\s*(?:على|عند|الى|إلى|ل)?\s*(.+)$/
	);
	const navName = (navEn && navEn[1]) || (navAr && navAr[1]) || "";
	if (navName) {
		const market = navName
			.replace(
				/\b(?:market|supermarket|store|shop|mart|سوبر ماركت|سوبرماركت|محل|متجر|سوق)\b/gi,
				""
			)
			.replace(/[.,!?؟]+$/g, "")
			.replace(/\s+/g, " ")
			.trim();
		if (market) return { intent: "open_market", market, items: [] };
	}

	return { intent: "search", market: "", items: fallbackExtractTerms(clean) };
}

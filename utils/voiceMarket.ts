// "Go to <market>" voice navigation: fuzzy-match the spoken store name against
// the public markets list. Extracted from the old floating voice button so the
// voice sheet and any future caller share one matcher.
import { MarketService } from "@/services/api";
import type { Market } from "@/types";

/** A market's display text whether `name` is a string or { en, ar, ... }. */
export const marketNameText = (m: Market | null | undefined): string => {
	const n = m?.name as unknown;
	if (!n) return "";
	if (typeof n === "string") return n;
	if (typeof n === "object")
		return Object.values(n as Record<string, unknown>)
			.filter((v) => typeof v === "string")
			.join(" ");
	return String(n);
};

const normalizeName = (s: string | null | undefined): string =>
	String(s || "")
		.toLowerCase()
		.replace(/[^a-z0-9؀-ۿ]+/g, " ")
		.trim();

/** Best candidate (exact > contains > shared words), or null if none is close. */
export const matchMarket = (markets: Market[], spoken: string): Market | null => {
	const q = normalizeName(spoken);
	if (!q) return null;
	const qWords = q.split(" ").filter((w) => w.length >= 2);
	let best: Market | null = null;
	let bestScore = 0;
	for (const m of markets) {
		const name = normalizeName(marketNameText(m));
		if (!name) continue;
		let score = 0;
		if (name === q) score = 100;
		else if (name.includes(q) || q.includes(name)) score = 60;
		else {
			const nWords = name.split(" ");
			const overlap = qWords.filter((w) =>
				nWords.some((nw) => nw === w || nw.startsWith(w) || w.startsWith(nw)),
			).length;
			if (overlap) score = 20 + overlap * 15;
		}
		if (score > bestScore) {
			bestScore = score;
			best = m;
		}
	}
	return bestScore >= 35 ? best : null;
};

/** Resolve the spoken store name to a market route, or null if no match. */
export const findMarketRoute = async (spokenName: string): Promise<string | null> => {
	try {
		const res = await MarketService.listPublic();
		const markets = Array.isArray(res?.data) ? res.data : [];
		const match = matchMarket(markets, spokenName);
		if (!match) return null;
		return `/market/${match._id}?marketName=${encodeURIComponent(marketNameText(match))}`;
	} catch (e) {
		console.warn("findMarketRoute error:", (e as Error)?.message);
		return null;
	}
};

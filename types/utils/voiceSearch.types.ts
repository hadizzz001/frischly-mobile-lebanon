// Structured result of interpreting what the shopper said.
export type VoiceIntent = {
	intent: "search" | "open_market";
	market: string;
	items: string[];
};

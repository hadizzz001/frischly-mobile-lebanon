export type VoicePhase =
	| "checking" // reading the mic permission state
	| "prompt" // in-app explanation before the OS permission dialog
	| "blocked" // permission denied and can't be asked again -> Settings link
	| "ready" // mic allowed; waiting for the shopper to hold the button
	| "recording" // button held down
	| "processing"
	| "error";

export interface VoiceSearchSheetProps {
	visible: boolean;
	onClose: () => void;
}

export interface VoiceExampleChip {
	/** Translation key of the chip label. */
	key: string;
	/** Shop route the chip fires (tap-to-search fallback). */
	route: string;
}

import type { Market } from "@/types";

export interface MarketHomeProps {
	marketId: string;
	/** Name shown in the bar until the market itself has loaded. */
	marketName?: string;
	/** The market, when the caller already has it (skips looking it up). */
	market?: Market | null;
	/**
	 * Back button in the bar. On by default (the /market/[id] screen); off when
	 * this market IS the home tab, where there is nothing to go back to.
	 */
	showBack?: boolean;
	/** Also called on pull-to-refresh (the home tab re-checks its stores). */
	onRefresh?: () => void;
}

import type { Address } from "@/types";

export interface AddressSheetProps {
	visible: boolean;
	onClose: () => void;
	/** Existing saved address, used to prefill the form. */
	address?: Address | null;
	/** Called with the saved address after a successful save. */
	onSaved?: (address: Address) => void;
	/** Checkout: the city is fixed to the shopper's delivery location (the
	 *  cart is city-scoped), so only the pin/street/building/landmark change. */
	lockCity?: boolean;
}

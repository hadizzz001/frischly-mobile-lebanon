import type { ReactNode } from "react";

export interface AppBottomSheetProps {
	/** Controls presentation: true = present, false = dismiss. */
	visible: boolean;
	onClose: () => void;
	/** e.g. ["60%", "90%"]. Defaults to a single content-fit snap. */
	snapPoints?: (string | number)[];
	title?: string;
	/** Rendered to the right of the title (e.g. "Reset all"). */
	headerRight?: ReactNode;
	children: ReactNode;
	/** Pin content to the bottom (sticky CTA) — rendered outside the scroll. */
	footer?: ReactNode;
	/** Use a scrollable body (default) or a plain view. */
	scrollable?: boolean;
	/** Keep the sheet open when the backdrop is tapped. */
	disableBackdropClose?: boolean;
}

export interface AppBottomSheetHandle {
	dismiss: () => void;
}

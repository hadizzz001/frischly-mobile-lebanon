export interface LoadingOverlayProps {
	visible: boolean;
	/** Short line under the spinner, e.g. "Switching language…". */
	label?: string;
	/**
	 * Render as a plain view filling the parent instead of a native Modal.
	 * Needed when the loader can open in the same tap that closes another
	 * Modal (see LoadingOverlay).
	 */
	inline?: boolean;
}

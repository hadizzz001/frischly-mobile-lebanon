export interface LocationSheetProps {
	visible: boolean;
	onClose: () => void;
	/** Currently saved city (for the highlighted row + address card). */
	currentCity: string;
	currentStreet?: string;
	/** Called after the address has been saved successfully. */
	onSaved?: (city: string) => void;
}

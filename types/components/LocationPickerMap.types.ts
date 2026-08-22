export interface PickedLocation {
	latitude: number;
	longitude: number;
}

export interface LocationPickerMapProps {
	visible: boolean;
	initialLocation?: PickedLocation | null;
	onClose: () => void;
	onConfirm: (location: PickedLocation) => void;
	title?: string;
	confirmLabel?: string;
	useMyLocationLabel?: string;
}

export interface IOSDatePickerModalProps {
	visible: boolean;
	value: Date;
	mode?: "date" | "time" | "datetime";
	minimumDate?: Date;
	maximumDate?: Date;
	onConfirm: (date: Date) => void;
	onCancel: () => void;
	doneLabel?: string;
	cancelLabel?: string;
	title?: string;
}

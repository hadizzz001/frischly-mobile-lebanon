import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import { styles } from "@/styles/components/IOSDatePickerModal.styles";

/**
 * A modal wrapper around @react-native-community/datetimepicker's spinner
 * display, used exclusively on iOS.
 *
 * On iOS, the native "spinner" / "inline" pickers fire onChange for every
 * single scroll change (day, month, year, hour, minute...) and, because most
 * call sites were closing the picker on the very first onChange, the picker
 * appeared to "close immediately" after touching any single wheel.
 *
 * This component keeps the picker open in a bottom-sheet style modal and only
 * commits the selected date (via onConfirm) when the user taps "Done". The
 * picker can also be dismissed without changes via "Cancel" or by tapping the
 * backdrop.
 *
 * Android is NOT affected: this component renders nothing on Android, since
 * Android's native picker dialog already has its own OS-level Ok/Cancel UI
 * and should keep using the platform default behavior.
 */
interface IOSDatePickerModalProps {
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

export default function IOSDatePickerModal({
	visible,
	value,
	mode = "date",
	minimumDate,
	maximumDate,
	onConfirm,
	onCancel,
	doneLabel = "Done",
	cancelLabel = "Cancel",
	title,
}: IOSDatePickerModalProps) {
	const [tempDate, setTempDate] = useState(value);

	useEffect(() => {
		if (visible) setTempDate(value);
	}, [visible, value]);

	if (Platform.OS !== "ios") return null;

	return (
		<Modal
			transparent
			animationType="slide"
			visible={visible}
			onRequestClose={onCancel}
		>
			<TouchableOpacity
				style={styles.backdrop}
				activeOpacity={1}
				onPress={onCancel}
			/>
			<View style={styles.sheet}>
				<View style={styles.toolbar}>
					<TouchableOpacity onPress={onCancel} hitSlop={8}>
						<Text style={styles.cancelText}>{cancelLabel}</Text>
					</TouchableOpacity>
					{title ? <Text style={styles.title}>{title}</Text> : null}
					<TouchableOpacity onPress={() => onConfirm(tempDate)} hitSlop={8}>
						<Text style={styles.doneText}>{doneLabel}</Text>
					</TouchableOpacity>
				</View>
				<DateTimePicker
					value={tempDate}
					mode={mode}
					display="spinner"
					minimumDate={minimumDate}
					maximumDate={maximumDate}
					onChange={(_event, selectedDate) => {
						if (selectedDate) setTempDate(selectedDate);
					}}
					style={styles.picker}
				/>
			</View>
		</Modal>
	);
}

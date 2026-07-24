import { LEBANESE_CITIES } from "@/constants/lebaneseCities";
import { useTranslation } from "@/contexts/TranslationContext";
import { Picker } from "@react-native-picker/picker";
import type { StyleProp, ViewStyle } from "react-native";
import { Platform, StyleSheet, View } from "react-native";

interface CityPickerProps {
	value?: string;
	onValueChange: (city: string) => void;
	placeholder?: string;
	textColor?: string;
	style?: StyleProp<ViewStyle>;
	disabled?: boolean;
}

/**
 * Reusable dropdown for selecting a Lebanese city.
 */
export default function CityPicker({
	value,
	onValueChange,
	placeholder,
	textColor = "#000",
	style,
	disabled = false,
}: CityPickerProps) {
	const { t } = useTranslation();
	return (
		<View style={[styles.wrapper, style, disabled && styles.wrapperDisabled]}>
			<Picker
				selectedValue={value || ""}
				onValueChange={(val) => {
					if (disabled) return;
					onValueChange(val as string);
				}}
				enabled={!disabled}
				dropdownIconColor={textColor}
				style={[styles.picker, { color: value ? textColor : "#999" }]}
				mode="dropdown"
			>
				<Picker.Item label={placeholder || t("selectCity")} value="" color="#999" />
				{LEBANESE_CITIES.map((city) => (
					<Picker.Item key={city} label={city} value={city} color="#000" />
				))}
			</Picker>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 15,
		justifyContent: "center",
		overflow: "hidden",
		// Android needs height; iOS renders a compact picker inline.
		...Platform.select({
			android: { height: 55 },
			default: {},
		}),
	},
	wrapperDisabled: {
		backgroundColor: "#f2f2f2",
		borderColor: "#ddd",
	},
	picker: {
		width: "100%",
		...Platform.select({
			android: { height: 55 },
			default: {},
		}),
	},
});

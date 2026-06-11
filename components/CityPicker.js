import { LEBANESE_CITIES } from "@/constants/lebaneseCities";
import { useTranslation } from "@/contexts/TranslationContext";
import { Picker } from "@react-native-picker/picker";
import { Platform, StyleSheet, View } from "react-native";

/**
 * Reusable dropdown for selecting a Lebanese city.
 *
 * Props:
 * - value: currently selected city (string)
 * - onValueChange: (city: string) => void
 * - placeholder: label shown when no city is selected
 * - textColor: color for the selected value text
 * - style: optional style override for the wrapper
 */
export default function CityPicker({
	value,
	onValueChange,
	placeholder,
	textColor = "#000",
	style,
}) {
	const { t } = useTranslation();
	return (
		<View style={[styles.wrapper, style]}>
			<Picker
				selectedValue={value || ""}
				onValueChange={(val) => onValueChange(val)}
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
	picker: {
		width: "100%",
		...Platform.select({
			android: { height: 55 },
			default: {},
		}),
	},
});

import { LEBANESE_CITIES } from "@/constants/lebaneseCities";
import { useTranslation } from "@/contexts/TranslationContext";
import { Picker } from "@react-native-picker/picker";
import type { StyleProp, ViewStyle } from "react-native";
import { Platform, View } from "react-native";
import { styles } from "@/styles/components/CityPicker.styles";

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

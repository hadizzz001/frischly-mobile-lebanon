import { styles } from "@/styles/components/StarRating.styles";
import { MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";

import type { StarRatingProps } from "@/types/components/StarRating.types";

// Simple 1-5 star rating control.
// - Pass `rating` (0-5, 0 = nothing selected yet) and `onChange` to make it
//   interactive: tapping a star fills it (and every star before it).
// - Omit `onChange` to render a read-only display (e.g. showing a past rating).
// All stars start unfilled by default (rating = 0).
export default function StarRating({
	rating = 0,
	onChange,
	size = 32,
	color = "#f4bb26",
	emptyColor = "#d9d9d9",
	style,
}: StarRatingProps) {
	const stars = [1, 2, 3, 4, 5];

	return (
		<View style={[styles.row, style]}>
			{stars.map((value) => {
				const filled = value <= rating;
				const star = (
					<MaterialIcons
						name={filled ? "star" : "star-border"}
						size={size}
						color={filled ? color : emptyColor}
					/>
				);

				if (!onChange) {
					return (
						<View key={value} style={styles.starBtn}>
							{star}
						</View>
					);
				}

				return (
					<TouchableOpacity
						key={value}
						onPress={() => onChange(value)}
						hitSlop={6}
						style={styles.starBtn}
						activeOpacity={0.7}
					>
						{star}
					</TouchableOpacity>
				);
			})}
		</View>
	);
}

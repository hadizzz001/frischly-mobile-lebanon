import { useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const QuantitySelector = ({ initialQty = 1, productId, onChange }) => {
	const [qty, setQty] = useState(initialQty);
	const [maxStock, setMaxStock] = useState(null);

	useEffect(() => {
		setQty(1);

		const fetchStock1 = async () => {
			try {
				const response = await fetch(
					`https://frischly-dash-leb.onrender.com/api/products/${productId}`
				);
				const result = await response.json();

				if (response.ok && result?.data?.stock !== undefined) {
					setMaxStock(result.data.stock);
				} else {
					console.error(
						"Failed to fetch stock2:",
						result.error || "Unknown error"
					);
					setMaxStock(0);
				}
			} catch (error) {
				console.error("Error fetching stock2:", error);
				setMaxStock(0);
			}
		};

		fetchStock1();
	}, [productId]);

	const handleIncrement = () => {
		if (maxStock !== null && qty < maxStock) {
			const newQty = qty + 1;
			setQty(newQty);
			onChange(newQty);
		}
	};

	const handleDecrement = () => {
		if (qty > 1) {
			const newQty = qty - 1;
			setQty(newQty);
			onChange(newQty);
		}
	};

	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.button} onPress={handleDecrement}>
				<Text style={styles.buttonText}>-</Text>
			</TouchableOpacity>

			<TextInput value={qty.toString()} editable={false} style={styles.input} />

			<TouchableOpacity
				style={[
					styles.button,
					maxStock !== null && qty >= maxStock && styles.disabledButton,
				]}
				onPress={handleIncrement}
				disabled={maxStock !== null && qty >= maxStock}
			>
				<Text style={styles.buttonText}>+</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
	},
	button: {
		width: 30,
		height: 30,
		backgroundColor: "#FFFFFF",
		justifyContent: "center",
		alignItems: "center",
		marginHorizontal: 5,
		borderRadius: 4,
	},
	disabledButton: {
		opacity: 0.5,
	},
	buttonText: {
		fontWeight: "900",
		fontSize: 18,
	},
	input: {
		width: 40,
		height: 30,
		textAlign: "center",
		borderColor: "#000000",
		borderWidth: 1,
		borderRadius: 4,
		paddingVertical: 0,
	},
});

export default QuantitySelector;

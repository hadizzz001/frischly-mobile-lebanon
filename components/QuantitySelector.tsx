import { ProductService } from "@/services/api";
import { useEffect, useState } from "react";
import { styles } from "@/styles/components/QuantitySelector.styles";
import {
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

interface QuantitySelectorProps {
	initialQty?: number;
	productId: string;
	onChange: (qty: number) => void;
}

export default function QuantitySelector({
	initialQty = 1,
	productId,
	onChange,
}: QuantitySelectorProps) {
	const [qty, setQty] = useState<number>(initialQty);
	const [maxStock, setMaxStock] = useState<number | null>(null);

	useEffect(() => {
		setQty(1);

		const fetchStock1 = async () => {
			try {
				const res = await ProductService.getById(productId);

				if (res?.data?.stock !== undefined) {
					setMaxStock(res.data.stock);
				} else {
					console.error("Failed to fetch stock2: Unknown error");
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
}

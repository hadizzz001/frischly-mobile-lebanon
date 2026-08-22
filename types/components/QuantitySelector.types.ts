export interface QuantitySelectorProps {
	initialQty?: number;
	productId: string;
	onChange: (qty: number) => void;
}

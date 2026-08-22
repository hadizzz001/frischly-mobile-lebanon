import type { CartItem, User } from "@/types";

export interface AppliedPromo {
	promoCode: { id?: string; code?: string };
}

export interface CheckoutPageProps {
	items: CartItem[];
	customer: User | null;
	// Current value of the phone field on the checkout form. Required — an
	// order can't be placed without a valid 7-or-8-digit Lebanese number.
	phone?: string;
	// Optional extra gate called right before anything else happens when the
	// shopper taps "Place Order". Return false to abort (e.g. to show a custom
	// alert from the parent screen for an invalid phone number).
	onValidatePhone?: () => boolean;
	setShowModal: (show: boolean) => void;
	modalResponse?: string | null;
	paymentMethod?: string;
	deliveryTime?: string;
	appliedPromo?: AppliedPromo | null;
	discountAmount?: number;
}

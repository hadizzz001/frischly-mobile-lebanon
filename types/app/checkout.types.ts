import type { User } from "@/types";

export interface AppliedPromo {
	promoCode: { id?: string; code?: string };
	discountAmount: number;
	[key: string]: unknown;
}

export interface CheckoutInputs {
	name: string;
	email: string;
	phone: string;
	country: string;
	state: string;
	city: string;
	street: string;
}

export interface CheckoutState {
	loading: boolean;
	user: User | null;
	token: string | null;
	inputs: CheckoutInputs;
	country: string;
}

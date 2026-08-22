export interface ValidatePromoPayload {
	code: string;
	orderTotal: number;
	market?: string | null;
}

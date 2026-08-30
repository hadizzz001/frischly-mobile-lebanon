import type { Address } from "@/types/models";

// Payload returned by GET /orders/:id/rider-location. Mirrors the admin
// riderslocation dashboard: live GPS if available, otherwise address/city/zone
// data the client geocodes as a fallback.
export interface RiderLocationInfo {
	hasRider?: boolean;
	hasLocation?: boolean;
	// Current order status (e.g. "ready for pickup") — shown on the tracking
	// screen when no driver is assigned yet so the user knows why.
	orderStatus?: string;
	latitude?: number;
	longitude?: number;
	address?: Address;
	zones?: string[];
	lastUpdated?: string;
	rider?: {
		name?: string;
		phone?: string;
		vehicleType?: string;
		vehicleNumber?: string;
	} | null;
	[key: string]: unknown;
}

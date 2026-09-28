// Single write path for the shopper's delivery address.
//
// The Appbar location pill, the checkout address card and the profile editor
// all save through here, so the profile, the local cache and every listener
// (home feeds, header pill, cart gate) always agree on ONE address. The
// backend replaces the whole `address` object on update rather than merging
// it, so the existing fields are always carried forward.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";

import { DEFAULT_STREET } from "@/constants/address";
import { USER_CITY_CHANGED } from "@/constants/events";
import { AuthService } from "@/services/api";
import type { Address, User } from "@/types";
import { getCityCoordinates, getStateForCity } from "@/utils/cityDetection";

/** Separator AddressSheet uses to fold street · building · landmark into `street`. */
export const STREET_SEP = " · ";

const norm = (v?: string | null) => String(v || "").trim().toLowerCase();

/**
 * A street that only repeats the city name (or the "Beirut" placeholder the
 * defaults leak in) carries no information — it must never be displayed next
 * to the city, otherwise the UI reads "Beirut, Beirut" / "Tripoli, Beirut".
 */
export const isPlaceholderStreet = (street?: string | null, city?: string | null): boolean => {
	const s = norm(street);
	if (!s) return true;
	if (s === norm(city)) return true;
	return s === norm(DEFAULT_STREET);
};

/** Street / building / landmark for display — never the city, never the placeholder. */
export const formatStreetLine = (address?: Pick<Address, "street" | "city"> | null): string => {
	if (!address) return "";
	const city = norm(address.city);
	return String(address.street || "")
		.split(STREET_SEP)
		.map((part) => part.trim())
		.filter((part) => part && norm(part) !== city && norm(part) !== norm(DEFAULT_STREET))
		.join(STREET_SEP);
};

export interface AddressPatch {
	city?: string;
	street?: string;
	state?: string;
	location?: { latitude: number; longitude: number } | null;
}

type StoredUserData = { token?: string; user?: User } | null;

const readStored = async (): Promise<StoredUserData> => {
	try {
		const raw = await AsyncStorage.getItem("userData");
		return raw ? (JSON.parse(raw) as StoredUserData) : null;
	} catch {
		return null;
	}
};

/** The locally cached address (no network). */
export const getCachedAddress = async (): Promise<Address> => {
	const stored = await readStored();
	return (stored?.user?.address as Address) || {};
};

/** Is the current session a signed-in shopper (not a guest)? */
export const isSignedIn = async (): Promise<boolean> => {
	const guest = await AsyncStorage.getItem("guest");
	if (guest === "true") return false;
	const stored = await readStored();
	return !!stored?.token;
};

/**
 * Merge `patch` into the saved address, derive the governorate and (when the
 * city changed without a pin) snap the pin to the city centre, persist to the
 * profile + local cache, and broadcast USER_CITY_CHANGED.
 */
export const saveUserAddress = async (patch: AddressPatch): Promise<Address> => {
	const stored = await readStored();
	const existing = (stored?.user?.address as Address) || {};

	const city = (patch.city ?? existing.city ?? "").trim();
	const state = patch.state ?? (city ? getStateForCity(city) : undefined) ?? existing.state;
	let location = patch.location === undefined ? existing.location : patch.location || undefined;
	if (patch.city && patch.city !== existing.city && patch.location === undefined) {
		// City switched from a list: move the stale pin to the new city's centre
		// so the map pin and the city never disagree.
		location = getCityCoordinates(city) || location;
	}

	// Switching city from a list leaves the old street behind. If that street
	// was only the previous city's name (or the default placeholder) it would
	// now show up as "Tripoli, Beirut" — drop it instead.
	let street = patch.street;
	if (street === undefined && patch.city && patch.city !== existing.city && isPlaceholderStreet(existing.street, existing.city)) {
		street = "";
	}

	const nextAddress: Address = {
		...existing,
		...(city ? { city } : {}),
		...(street !== undefined ? { street: street.trim() } : {}),
		...(state ? { state } : {}),
		...(location ? { location } : {}),
		country: existing.country || "LB",
	};
	// Never send `street: ""` — the profile validator rejects an empty street
	// (isLength min 1, reported as the confusing "must be less than 200
	// characters"). The backend replaces the whole address object, so leaving
	// the key out is how a cleared / placeholder street actually gets dropped.
	if (!nextAddress.street) delete nextAddress.street;

	await AuthService.updateProfile({ address: nextAddress });

	if (stored?.user) {
		await AsyncStorage.setItem(
			"userData",
			JSON.stringify({ ...stored, user: { ...stored.user, address: nextAddress } }),
		);
	}

	DeviceEventEmitter.emit(USER_CITY_CHANGED, { city, state, location, street: nextAddress.street ?? "" });
	return nextAddress;
};

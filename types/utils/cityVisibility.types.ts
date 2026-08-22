// A serving-cities value can arrive in many shapes over the wire.
export type CityValue =
	| string
	| null
	| undefined
	| { city?: unknown; name?: unknown }
	| CityValue[];

// A generic entity (market, kitchen market, settings, product) that may carry
// serving-cities info under a variety of keys.
export type CityEntity = Record<string, unknown> & {
	location?: { city?: CityValue; cities?: CityValue } | unknown;
};

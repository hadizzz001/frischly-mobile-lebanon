// utils/phone.js
// Normalizes Lebanese phone numbers into a consistent E.164-style format.
export const normalizeLebanesePhone = (input: string | number | null | undefined): string => {
  const digits = String(input || "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("00961")) {
    return `+${digits.slice(2)}`;
  }

  if (digits.startsWith("961")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 9) {
    return `+961${digits.slice(1)}`;
  }

  if (digits.length === 8) {
    return `+961${digits}`;
  }

  return digits.length >= 8 ? `+${digits}` : "";
};

// Strips any country-code prefix (+961 / 961 / 00961) and leading zero(s)
// from a raw phone number, leaving just the local subscriber digits. Used to
// validate the number regardless of how it's currently formatted (with/
// without country code, with/without a leading 0).
export const extractLocalLebanesePhoneDigits = (
  input: string | number | null | undefined
): string => {
  let digits = String(input || "").replace(/\D/g, "");
  digits = digits.replace(/^00961/, "").replace(/^961/, "");
  digits = digits.replace(/^0+/, "");
  return digits;
};

// A valid Lebanese local number is 7 or 8 digits (mobile numbers are 8
// digits, e.g. "3XXXXXXX"/"7XXXXXXXX"; some older landlines are 7 digits).
// Country code / leading zero are optional and ignored. Same rule enforced
// at registration (see app/register.tsx) — reused here so checkout enforces
// it too.
export const isValidLebanesePhone = (
  input: string | number | null | undefined
): boolean => /^\d{7,8}$/.test(extractLocalLebanesePhoneDigits(input));


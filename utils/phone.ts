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

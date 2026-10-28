/**
 * Phone normalisation — PRD §8: E.164, Nigeria default +234.
 * Pure helper in shared/lib (FSD entities-agnostic).
 */

export function normalizeNigerianPhone(input: string): string {
  const trimmed = input.trim().replace(/[\s\-()]/g, "");
  if (trimmed.startsWith("+")) {
    if (!/^\+234\d{10}$/.test(trimmed)) {
      throw new Error("Invalid Nigerian phone number. Expected +234XXXXXXXXXX.");
    }
    return trimmed;
  }
  // 0XXXXXXXXXX -> +234XXXXXXXXXX
  if (/^0\d{10}$/.test(trimmed)) {
    return `+234${trimmed.slice(1)}`;
  }
  // 234XXXXXXXXXX -> +234XXXXXXXXXX
  if (/^234\d{10}$/.test(trimmed)) {
    return `+${trimmed}`;
  }
  // 10-digit without leading 0
  if (/^\d{10}$/.test(trimmed)) {
    return `+234${trimmed}`;
  }
  throw new Error("Invalid Nigerian phone number.");
}

export function isValidNigerianPhone(input: string): boolean {
  try {
    normalizeNigerianPhone(input);
    return true;
  } catch {
    return false;
  }
}

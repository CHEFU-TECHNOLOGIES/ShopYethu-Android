// Local format checks only. Number ownership still requires SMS verification.
export function normalizeApplicationPhone(input: string): string | null {
  if (input.length > 30 || !/^\+?[\d\s()-]+$/.test(input.trim())) return null;
  const cleaned = input.replace(/[\s()-]/g, '');
  const phone = /^0[1-9]\d{8}$/.test(cleaned) ? `+27${cleaned.slice(1)}` : cleaned;
  return /^\+27[1-9]\d{8}$/.test(phone) ? phone : null;
}

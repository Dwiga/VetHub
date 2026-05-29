/**
 * Normalize an Indonesian phone number to canonical +62 format.
 * Handles: 085xxx, 62xxx, +62xxx, 8xxx (no prefix)
 */
export function normalizePhone(phone: string): string {
  const p = phone.replace(/[\s\-().]/g, "");
  if (p.startsWith("+62")) return p;
  if (p.startsWith("62")) return "+" + p;
  if (p.startsWith("0")) return "+62" + p.slice(1);
  // bare number like 85xxx — assume Indonesian mobile
  if (/^8\d{8,11}$/.test(p)) return "+62" + p;
  return p;
}

/**
 * Returns all storage variants of a phone to handle legacy data
 * stored in either 08xx or +628xx form.
 */
export function phoneVariants(phone: string): string[] {
  const canonical = normalizePhone(phone);
  const variants = new Set<string>([phone.trim(), canonical]);
  if (canonical.startsWith("+62")) {
    variants.add("0" + canonical.slice(3));   // +628xxx → 08xxx
    variants.add(canonical.slice(1));          // +62xxx  → 62xxx
  }
  return Array.from(variants).filter(Boolean);
}

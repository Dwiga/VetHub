/**
 * Normalize an Indonesian phone number to canonical +62 format.
 * Handles: 085xxx, 62xxx, +62xxx, bare 8xxx
 */
export function normalizePhone(phone: string): string {
  const p = phone.replace(/[\s\-().]/g, "");
  if (p.startsWith("+62")) return p;
  if (p.startsWith("62")) return "+" + p;
  if (p.startsWith("0")) return "+62" + p.slice(1);
  if (/^8\d{8,11}$/.test(p)) return "+62" + p;
  return p;
}

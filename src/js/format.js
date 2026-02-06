export function toNumberLoose(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // NL invoer: "1.234,56" of "1234,56" → "1234.56"
  const normalized = s
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function formatEUR(value) {
  if (value == null || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPct(value) {
  if (value == null || !Number.isFinite(value)) return "";
  return `${new Intl.NumberFormat("nl-NL", {
    maximumFractionDigits: 2
  }).format(value)}%`;
}

export function formatInt(value) {
  if (value == null || !Number.isFinite(value)) return "";
  return String(Math.round(value));
}

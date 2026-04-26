export function currencyCode(vsCurrency = "usd") {
  const code = String(vsCurrency || "usd").toUpperCase();
  if (code === "INR") return "INR";
  return "USD";
}

export function formatMoney(value, vsCurrency = "usd", options = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/A";

  const code = currencyCode(vsCurrency);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
    maximumFractionDigits: num >= 1 ? 2 : 8,
    ...options,
  }).format(num);
}

export function formatCompactNumber(value, options = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/A";
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 2,
    ...options,
  }).format(num);
}


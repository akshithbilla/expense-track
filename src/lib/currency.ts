export const DEFAULT_CURRENCY = "INR";

export const CURRENCIES: Record<string, { symbol: string; name: string }> = {
  INR: { symbol: "₹", name: "Indian Rupee" },
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "British Pound" },
  JPY: { symbol: "¥", name: "Japanese Yen" },
  CNY: { symbol: "¥", name: "Chinese Yuan" },
  CAD: { symbol: "C$", name: "Canadian Dollar" },
  AUD: { symbol: "A$", name: "Australian Dollar" },
  CHF: { symbol: "CHF", name: "Swiss Franc" },
  SGD: { symbol: "S$", name: "Singapore Dollar" },
  AED: { symbol: "د.إ", name: "UAE Dirham" },
};

export function formatMoney(amount: number, currency = DEFAULT_CURRENCY, compact = false) {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : undefined, {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 2,
    }).format(amount);
  } catch {
    const s = CURRENCIES[currency]?.symbol ?? "";
    return `${s}${amount.toFixed(2)}`;
  }
}

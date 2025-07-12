const currencyFormat = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
  currencyDisplay: "symbol",
});

export function formatCurrency(value: number | null): string {
  return value != null ? currencyFormat.format(value) : "";
}

export function parseCurrency(str: string): number | null {
  const v = parseFloat(str.replace("$", ""));
  return v === v ? v : null;
}

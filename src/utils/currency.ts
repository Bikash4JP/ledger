// src/utils/currency.ts
// Supported display currencies for MobiLedger

export type CurrencyOption = {
  code: string;
  symbol: string;
  label: string;
  labelJa: string;
};

export const CURRENCIES: CurrencyOption[] = [
  { code: 'JPY', symbol: '¥',   label: 'Japanese Yen',      labelJa: '日本円' },
  { code: 'USD', symbol: '$',   label: 'US Dollar',          labelJa: '米ドル' },
  { code: 'EUR', symbol: '€',   label: 'Euro',               labelJa: 'ユーロ' },
  { code: 'GBP', symbol: '£',   label: 'British Pound',      labelJa: '英ポンド' },
  { code: 'INR', symbol: '₹',   label: 'Indian Rupee',       labelJa: 'インドルピー' },
  { code: 'AUD', symbol: 'A$',  label: 'Australian Dollar',  labelJa: '豪ドル' },
  { code: 'CAD', symbol: 'C$',  label: 'Canadian Dollar',    labelJa: 'カナダドル' },
  { code: 'SGD', symbol: 'S$',  label: 'Singapore Dollar',   labelJa: 'シンガポールドル' },
  { code: 'CNY', symbol: 'CN¥', label: 'Chinese Yuan',       labelJa: '人民元' },
  { code: 'KRW', symbol: '₩',   label: 'Korean Won',         labelJa: '韓国ウォン' },
  { code: 'THB', symbol: '฿',   label: 'Thai Baht',          labelJa: 'タイバーツ' },
  { code: 'NPR', symbol: 'रू',  label: 'Nepali Rupee',       labelJa: 'ネパールルピー' },
];

export const DEFAULT_CURRENCY: CurrencyOption = CURRENCIES[0]; // JPY

/**
 * Format an amount with currency symbol.
 */
export function formatWithCurrency(
  amount: number,
  symbol: string,
): string {
  if (!amount && amount !== 0) return `${symbol}0`;
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return `${symbol}${formatted}`;
}

// src/utils/ledgerLabels.ts
import type { Ledger } from '../models/ledger';

export type AppLanguage = 'en' | 'ja';

// ✅ All predefined ledger names and their Japanese labels.
// Key MUST match the English ledger name used when seeding ledgers.
const LEDGER_LABELS: Record<
  string,
  {
    en: string;
    ja: string;
  }
> = {
  // --- P&L / Trading accounts ---
  'Sales': { en: 'Sales', ja: '売上高' },
  'Sales Returns': { en: 'Sales Returns', ja: '売上返品' },
  'Purchases': { en: 'Purchases', ja: '仕入高' },
  'Purchase Returns': { en: 'Purchase Returns', ja: '仕入返品' },
  'Opening Stock': { en: 'Opening Stock', ja: '期首棚卸資産' },
  'Closing Stock': { en: 'Closing Stock', ja: '期末棚卸資産' },
  'Wages': { en: 'Wages', ja: '賃金' },
  'Carriage Inward/Freight on Purchases': {
    en: 'Carriage Inward/Freight on Purchases',
    ja: '仕入運賃',
  },
  'Fuel/Power': { en: 'Fuel/Power', ja: '燃料費・電力料' },
  'Rent Paid': { en: 'Rent Paid', ja: '支払家賃' },
  'Salaries': { en: 'Salaries', ja: '給料手当' },
  'Interest Paid': { en: 'Interest Paid', ja: '支払利息' },
  'Commission Paid': { en: 'Commission Paid', ja: '支払手数料' },
  'Discount Allowed': { en: 'Discount Allowed', ja: '売上割引' },
  'Bad Debts': { en: 'Bad Debts', ja: '貸倒損失' },
  'Depreciation': { en: 'Depreciation', ja: '減価償却費' },
  'Repairs': { en: 'Repairs', ja: '修繕費' },
  'Advertising': { en: 'Advertising', ja: '広告宣伝費' },
  'Rent Received': { en: 'Rent Received', ja: '受取家賃' },
  'Interest Received': { en: 'Interest Received', ja: '受取利息' },
  'Commission Received': { en: 'Commission Received', ja: '受取手数料' },
  'Discount Received': { en: 'Discount Received', ja: '仕入割引' },

  // Extra P&L accounts
  'Insurance': { en: 'Insurance', ja: '保険料' },
  'Electricity': { en: 'Electricity', ja: '電力料' },
  'Telephone/Internet': { en: 'Telephone/Internet', ja: '通信費' },
  'Travel Expenses': { en: 'Travel Expenses', ja: '旅費交通費' },
  'Office Expenses': { en: 'Office Expenses', ja: '事務費' },
  'Printing & Stationery': {
    en: 'Printing & Stationery',
    ja: '印刷費・文房具費',
  },
  'Legal Fees': { en: 'Legal Fees', ja: '法律顧問料' },
  'Audit Fees': { en: 'Audit Fees', ja: '監査報酬' },
  'Loss/Gain on Sale of Asset': {
    en: 'Loss/Gain on Sale of Asset',
    ja: '固定資産売却損益',
  },
  'Provision for Doubtful Debts': {
    en: 'Provision for Doubtful Debts',
    ja: '貸倒引当金繰入',
  },
  'Bank Charges': { en: 'Bank Charges', ja: '銀行手数料' },

  // --- Balance sheet: Assets ---
  'Land': { en: 'Land', ja: '土地' },
  'Building': { en: 'Building', ja: '建物' },
  'Plant & Machinery': {
    en: 'Plant & Machinery',
    ja: '機械装置',
  },
  'Furniture': { en: 'Furniture', ja: '備品' },
  'Vehicles': { en: 'Vehicles', ja: '車両運搬具' },
  'Cash in Hand': { en: 'Cash in Hand', ja: '現金' },
  'Cash at Bank': { en: 'Cash at Bank', ja: '銀行預金' },
  'Debtors/Accounts Receivable': {
    en: 'Debtors/Accounts Receivable',
    ja: '売掛金',
  },
  'Bills Receivable': { en: 'Bills Receivable', ja: '受取手形' },
  'Prepaid Expenses': { en: 'Prepaid Expenses', ja: '前払費用' },
  'Advance Payments': { en: 'Advance Payments', ja: '仮払金' },
  'Stock/Inventory': { en: 'Stock/Inventory', ja: '棚卸資産' },
  'Investments': { en: 'Investments', ja: '投資' },

  // Extra assets
  'Goodwill': { en: 'Goodwill', ja: 'のれん' },
  'Patents/Copyrights': {
    en: 'Patents/Copyrights',
    ja: '特許権・著作権',
  },
  'Machinery': { en: 'Machinery', ja: '機械装置' },
  'Furniture & Fixtures': {
    en: 'Furniture & Fixtures',
    ja: '器具備品',
  },
  'Motor Vehicles': { en: 'Motor Vehicles', ja: '車両運搬具' },
  'Leasehold Property': {
    en: 'Leasehold Property',
    ja: 'リース資産',
  },
  'Investments (long-term)': {
    en: 'Investments (long-term)',
    ja: '長期投資',
  },
  'Loans/Advances Given': {
    en: 'Loans/Advances Given',
    ja: '貸付金',
  },

  // --- Balance sheet: Liabilities & Equity ---
  'Capital': { en: 'Capital', ja: '資本金' },
  'Bank Loan': { en: 'Bank Loan', ja: '借入金' },
  'Creditors/Accounts Payable': {
    en: 'Creditors/Accounts Payable',
    ja: '買掛金',
  },
  'Bills Payable': { en: 'Bills Payable', ja: '支払手形' },
  'Outstanding Expenses': {
    en: 'Outstanding Expenses',
    ja: '未払費用',
  },
  'Interest Due': { en: 'Interest Due', ja: '未払利息' },

  'Drawings': { en: 'Drawings', ja: '事業主貸' },
  'Profit/Loss (from P&L)': {
    en: 'Profit/Loss (from P&L)',
    ja: '当期純損益',
  },
  'Reserves': { en: 'Reserves', ja: '準備金' },

  // Extra liabilities
  'Long-term Loans': { en: 'Long-term Loans', ja: '長期借入金' },
  'Debentures': { en: 'Debentures', ja: '社債' },
  'Provision for Taxation': {
    en: 'Provision for Taxation',
    ja: '法人税等引当金',
  },
  'Provision for Depreciation': {
    en: 'Provision for Depreciation',
    ja: '減価償却累計額',
  },
  'Reserves & Surplus': {
    en: 'Reserves & Surplus',
    ja: '利益剰余金',
  },
  'Bank Overdraft': { en: 'Bank Overdraft', ja: '銀行当座借越' },

  // Special internal
  'Opening Balance Adjustment': {
    en: 'Opening Balance Adjustment',
    ja: '期首残高調整',
  },
};

// Helper by *ledger object*
export function getLedgerLabel(ledger: Ledger, language: AppLanguage): string {
  const entry = LEDGER_LABELS[ledger.name];
  if (!entry) return ledger.name; // user-defined ledger → show as is
  return language === 'ja' ? entry.ja : entry.en;
}

// Helper by plain name (when we only have string)
export function getLedgerLabelByName(
  name: string,
  language: AppLanguage,
): string {
  const entry = LEDGER_LABELS[name];
  if (!entry) return name;
  return language === 'ja' ? entry.ja : entry.en;
}

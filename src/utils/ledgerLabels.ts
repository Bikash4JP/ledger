import type { Ledger } from '../models/ledger';

export type AppLanguage = 'en' | 'ja';

// 1. Standard Individual Ledger Names
// Added missing standard accounts from seed data
const LEDGER_LABELS: Record<string, { en: string; ja: string }> = {
  'Sales': { en: 'Sales', ja: '売上高' },
  'Sales Returns': { en: 'Sales Returns', ja: '売上返品' },
  'Purchases': { en: 'Purchases', ja: '仕入高' },
  'Purchase Returns': { en: 'Purchase Returns', ja: '仕入返品' },
  'Opening Stock': { en: 'Opening Stock', ja: '期首棚卸資産' },
  'Closing Stock': { en: 'Closing Stock', ja: '期末棚卸資産' },
  'Wages': { en: 'Wages', ja: '賃金' },
  'Carriage Inward/Freight on Purchases': { en: 'Carriage Inward/Freight on Purchases', ja: '仕入運賃' },
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
  'Insurance': { en: 'Insurance', ja: '保険料' },
  'Electricity': { en: 'Electricity', ja: '電力料' },
  'Telephone/Internet': { en: 'Telephone/Internet', ja: '通信費' },
  'Travel Expenses': { en: 'Travel Expenses', ja: '旅費交通費' },
  'Office Expenses': { en: 'Office Expenses', ja: '事務費' },
  'Printing & Stationery': { en: 'Printing & Stationery', ja: '印刷費・文房具費' },
  'Legal Fees': { en: 'Legal Fees', ja: '法律顧問料' },
  'Audit Fees': { en: 'Audit Fees', ja: '監査報酬' },
  'Loss/Gain on Sale of Asset': { en: 'Loss/Gain on Sale of Asset', ja: '固定資産売却損益' },
  'Provision for Doubtful Debts': { en: 'Provision for Doubtful Debts', ja: '貸倒引当金繰入' },
  'Bank Charges': { en: 'Bank Charges', ja: '銀行手数料' },
  'Land': { en: 'Land', ja: '土地' },
  'Building': { en: 'Building', ja: '建物' },
  'Plant & Machinery': { en: 'Plant & Machinery', ja: '機械装置' },
  'Furniture': { en: 'Furniture', ja: '備品' },
  'Vehicles': { en: 'Vehicles', ja: '車両運搬具' },
  'Cash in Hand': { en: 'Cash in Hand', ja: '現金' },
  'Cash at Bank': { en: 'Cash at Bank', ja: '銀行預金' },
  'Debtors/Accounts Receivable': { en: 'Debtors/Accounts Receivable', ja: '売掛金' },
  'Bills Receivable': { en: 'Bills Receivable', ja: '受取手形' },
  'Prepaid Expenses': { en: 'Prepaid Expenses', ja: '前払費用' },
  'Advance Payments': { en: 'Advance Payments', ja: '仮払金' },
  'Stock/Inventory': { en: 'Stock/Inventory', ja: '棚卸資産' },
  'Investments': { en: 'Investments', ja: '投資' },
  'Capital': { en: 'Capital', ja: '資本金' },
  'Bank Loan': { en: 'Bank Loan', ja: '借入金' },
  'Creditors/Accounts Payable': { en: 'Creditors/Accounts Payable', ja: '買掛金' },
  'Bills Payable': { en: 'Bills Payable', ja: '支払手形' },
  'Outstanding Expenses': { en: 'Outstanding Expenses', ja: '未払費用' },
  'Interest Due': { en: 'Interest Due', ja: '未払利息' },
  'Drawings': { en: 'Drawings', ja: '事業主貸' },
  'Profit/Loss (from P&L)': { en: 'Profit/Loss (from P&L)', ja: '当期純損益' },
  'Reserves': { en: 'Reserves', ja: '準備金' },
  'Long-term Loans': { en: 'Long-term Loans', ja: '長期借入金' },
  'Debentures': { en: 'Debentures', ja: '社債' },
  'Provision for Taxation': { en: 'Provision for Taxation', ja: '法人税等引当金' },
  'Provision for Depreciation': { en: 'Provision for Depreciation', ja: '減価償却累計額' },
  'Reserves & Surplus': { en: 'Reserves & Surplus', ja: '利益剰余金' },
  'Bank Overdraft': { en: 'Bank Overdraft', ja: '銀行当座借越' },
  'Opening Balance Adjustment': { en: 'Opening Balance Adjustment', ja: '期首残高調整' },
};

// 2. Ledger Nature Labels
const NATURE_LABELS: Record<string, { en: string; ja: string }> = {
  'Asset': { en: 'Asset', ja: '資産' },
  'Liability': { en: 'Liability', ja: '負債' },
  'Income': { en: 'Income', ja: '収益' },
  'Expense': { en: 'Expense', ja: '費用' },
};

// 3. Group Name Labels (Categories seen in screenshots)
const GROUP_LABELS: Record<string, { en: string; ja: string }> = {
  'Fixed Asset': { en: 'Fixed Asset', ja: '固定資産' },
  'Fixed Assets': { en: 'Fixed Assets', ja: '固定資産' },
  'Current Asset': { en: 'Current Asset', ja: '流動資産' },
  'Current Assets': { en: 'Current Assets', ja: '流動資産' },
  'Assets': { en: 'Assets', ja: '資産' },
  'Liabilities': { en: 'Liabilities', ja: '負債' },
  'Current Liability': { en: 'Current Liability', ja: '流動負債' },
  'Current Liabilities': { en: 'Current Liabilities', ja: '流動負債' },
  'Indirect Expense': { en: 'Indirect Expense', ja: '販売管理費' },
  'Indirect Expenses': { en: 'Indirect Expenses', ja: '販売管理費' },
  'Direct Expense': { en: 'Direct Expense', ja: '直接経費' },
  'Direct Expenses': { en: 'Direct Expenses', ja: '直接経費' },
  'Inventory': { en: 'Inventory', ja: '棚卸資産' },
  'Capital & Reserves': { en: 'Capital & Reserves', ja: '純資産・準備金' },
  'Purchases': { en: 'Purchases', ja: '仕入勘定' },
};

export function getLedgerLabel(ledger: Ledger, language: AppLanguage): string {
  const entry = LEDGER_LABELS[ledger.name];
  return language === 'ja' && entry ? entry.ja : ledger.name;
}

export function getNatureLabel(nature: string, language: AppLanguage): string {
  const entry = NATURE_LABELS[nature];
  return language === 'ja' && entry ? entry.ja : nature;
}

export function getGroupLabel(groupName: string, language: AppLanguage): string {
  const entry = GROUP_LABELS[groupName];
  return language === 'ja' && entry ? entry.ja : groupName;
}

export function getLedgerLabelByName(name: string, language: AppLanguage): string {
  const entry = LEDGER_LABELS[name];
  return language === 'ja' && entry ? entry.ja : name;
}
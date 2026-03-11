// src/i18n/labels.ts
import { useSettings } from '../context/SettingsContext';

const en = {
  // Tabs & Headers
  'tabs.entries': 'Entries',
  'tabs.home': 'Home',
  'tabs.ledgers': 'Ledgers',
  'tabs.reports': 'Reports',
  'tabs.settings': 'Settings',

  // Ledgers Screen
  'ledgers.header': 'Ledgers',
  'ledgers.subtitle': 'Search party / expense / income / asset / liability ledgers.',
  'ledgers.recent.title': 'Recently used',
  'ledgers.all.title': 'All ledgers',
  'ledgers.search.results': 'Search results',
  'ledgers.search.placeholder': 'Search ledger by name...',
  'ledgers.empty': 'No ledgers found.',

  // Reports - Common
  'reports.header.title': 'Reports',
  'reports.header.subtitle': 'Trial balance, Profit & Loss, Balance Sheet, Cash Flow & Ledger Summary',
  'reports.modes.overall': 'Overall',
  'reports.modes.monthly': 'Monthly',
  'reports.modes.yearly': 'Yearly',
  'reports.period.all': 'All Transactions',

  // Reports - Trial Balance
  'reports.trial.title': 'Trial Balance',
  'reports.trial.ledger': 'Ledger',
  'reports.trial.debit': 'Debit',
  'reports.trial.credit': 'Credit',
  'reports.trial.total': 'TOTAL',

  // Reports - P&L
  'reports.pl.title': 'Profit & Loss Account',
  'reports.pl.expenses': 'Expenses (Dr)',
  'reports.pl.incomes': 'Incomes (Cr)',
  'reports.pl.totalExpenses': 'Total Expenses',
  'reports.pl.totalIncomes': 'Total Incomes',
  'reports.pl.netProfit': 'Net Profit',
  'reports.pl.netLoss': 'Net Loss',

  // Reports - Balance Sheet
  'reports.bs.title': 'Balance Sheet',
  'reports.bs.liabilities': 'Liabilities',
  'reports.bs.assets': 'Assets',
  'reports.bs.totalLiabilities': 'Total Liabilities',
  'reports.bs.totalAssets': 'Total Assets',

  // Reports - Cash Flow & Analysis
  'reports.cash.title': 'Cash Flow (Cash & Bank)',
  'reports.cash.hint': 'Based on movement in cash / bank ledgers',
  'reports.cash.inflow': 'Inflow',
  'reports.cash.outflow': 'Outflow',
  'reports.cash.net': 'Net',
  'reports.analysis.title': 'Ledger Analysis (Top 10 by Turnover)',
  'reports.analysis.turnover': 'Turnover',
  'reports.analysis.closing': 'Closing',

  // Reports - Planned
  'reports.planned.title': 'Planned Reports',
  'reports.planned.plTitle': 'Profit & Loss',
  'reports.planned.plText': 'More detailed P&L formats with schedules (Sales, Purchases, etc).',
  'reports.planned.bsTitle': 'Balance Sheet',
  'reports.planned.bsText': 'Assets / Liabilities / Capital with schedules.',

  // Settings - Currency
  'settings.currency.title': 'Currency',
  'settings.currency.subtitle': 'Display currency & live exchange rate',
  'settings.currency.rate': 'Live rate',
  'settings.currency.approx': 'Amounts are approximate conversions',
  'settings.currency.loading': 'Fetching exchange rate…',
  'settings.currency.home': 'Home currency (JPY) — no conversion',
};

const ja: typeof en = {
  // Tabs & Headers
  'tabs.entries': '仕訳',
  'tabs.home': 'ホーム',
  'tabs.ledgers': '元帳',
  'tabs.reports': 'レポート',
  'tabs.settings': '設定',

  // Ledgers Screen
  'ledgers.header': '元帳一覧',
  'ledgers.subtitle': '取引先、費用、収益、資産、負債の元帳を検索します。',
  'ledgers.recent.title': '最近使用した元帳',
  'ledgers.all.title': 'すべての元帳',
  'ledgers.search.results': '検索結果',
  'ledgers.search.placeholder': '元帳名で検索...',
  'ledgers.empty': '元帳が見つかりませんでした。',

  // Reports - Common
  'reports.header.title': 'レポート',
  'reports.header.subtitle': '合計残高試算表、損益計算書、貸借対照表、キャッシュ・フロー、元帳サマリー',
  'reports.modes.overall': '全期間',
  'reports.modes.monthly': '月次',
  'reports.modes.yearly': '年次',
  'reports.period.all': '全ての取引',

  // Reports - Trial Balance
  'reports.trial.title': '合計残高試算表',
  'reports.trial.ledger': '勘定科目',
  'reports.trial.debit': '借方',
  'reports.trial.credit': '貸方',
  'reports.trial.total': '合計',

  // Reports - P&L
  'reports.pl.title': '損益計算書',
  'reports.pl.expenses': '費用 (借方)',
  'reports.pl.incomes': '収益 (貸方)',
  'reports.pl.totalExpenses': '費用合計',
  'reports.pl.totalIncomes': '収益合計',
  'reports.pl.netProfit': '当期純利益',
  'reports.pl.netLoss': '当期純損失',

  // Reports - Balance Sheet
  'reports.bs.title': '貸借対照表',
  'reports.bs.liabilities': '負債・純資産',
  'reports.bs.assets': '資産',
  'reports.bs.totalLiabilities': '負債・純資産合計',
  'reports.bs.totalAssets': '資産合計',

  // Reports - Cash Flow & Analysis
  'reports.cash.title': 'キャッシュ・フロー (現預金)',
  'reports.cash.hint': '現預金科目の動きに基づいています',
  'reports.cash.inflow': '流入',
  'reports.cash.outflow': '流出',
  'reports.cash.net': '純増減',
  'reports.analysis.title': '元帳分析 (取引高上位10件)',
  'reports.analysis.turnover': '取引高',
  'reports.analysis.closing': '期末残高',

  // Reports - Planned
  'reports.planned.title': '追加予定のレポート',
  'reports.planned.plTitle': '損益計算書',
  'reports.planned.plText': '売上や仕入などの内訳を含む詳細な損益計算書。',
  'reports.planned.bsTitle': '貸借対照表',
  'reports.planned.bsText': '資産・負債・資本の内訳明細付き貸借対照表。',

  // Settings - Currency
  'settings.currency.title': '通貨',
  'settings.currency.subtitle': '表示通貨・リアルタイム為替換算',
  'settings.currency.rate': 'リアルタイムレート',
  'settings.currency.approx': '金額は概算換算値です',
  'settings.currency.loading': '為替レートを取得中…',
  'settings.currency.home': 'ホーム通貨 (JPY) — 換算なし',
};

export type LabelKey = keyof typeof en;
type Lang = 'en' | 'ja';

const translations: Record<Lang, Record<LabelKey, string>> = { en, ja };

export function useT() {
  const { settings } = useSettings();
  const lang: Lang = (settings.language as Lang) || 'en';

    return (key: LabelKey): string => {
      return translations[lang][key] || translations.en[key] || key;
    };
  }
// src/i18n/labels.ts
import { useSettings } from '../context/SettingsContext';

const en = {
  // Tabs
  'tabs.entries': 'Entries',
  'tabs.home': 'Home',
  'tabs.ledgers': 'Ledgers',
  'tabs.reports': 'Reports',
  'tabs.settings': 'Settings',

  // Settings
  'settings.title': 'Settings',
  'settings.subtitle':
    'App preferences, language, and (later) backup/sync.',
  'settings.language.title': 'Language',
  'settings.language.hint': 'Choose the language for the app interface.',
  'settings.language.current.en': 'Current: English',
  'settings.language.current.ja': 'Current: Japanese (日本語)',
  'settings.language.info':
    'UI text will gradually follow this setting as we add translations.',
  'settings.data.title': 'Data & Backup',
  'settings.data.hint': 'Right now all data is stored locally on this device.',
  'settings.data.info':
    'In the future, you can connect cloud sync (PostgreSQL / Firebase, etc.) so that ledgers are shared across devices.',
  'settings.about.title': 'About',
  'settings.about.info':
    'Tally-for-Mobile (ledger prototype)\nBuilt with React Native + Expo.\nDouble-entry, ledger view, trial balance, P&L and balance sheet are already working.',

  // Home
  'home.title': 'Dashboard',
  'home.subtitle': 'Quick overview of your books.',
  'home.card.quickEntry.title': 'Add Entry',
  'home.card.quickEntry.text':
    'Create a cash book entry or a journal voucher.',
  'home.card.ledgers.title': 'Ledgers',
  'home.card.ledgers.text':
    'Search and open any party or account ledger.',
  'home.card.reports.title': 'Reports',
  'home.card.reports.text':
    'Trial balance, P&L and balance sheet in one place.',
  'home.recentEntries.title': 'Recent Entries',
  'home.recentEntries.empty':
    'No entries yet. Start by adding your first transaction.',

  // Entries
  'entries.header': 'Entries',
  'entries.subtitle':
    'Browse all transactions and add new ones.',
  'entries.addButton': '+ Add Entry',
  'entries.recent.title': 'All Entries',
  'entries.empty': 'No entries recorded yet.',
  'entries.type.cashBook': 'Cash Book',
  'entries.type.journal': 'Journal',

  // Ledgers
  'ledgers.header': 'Ledgers',
  'ledgers.subtitle':
    'Search party / expense / income / asset / liability ledgers.',
  'ledgers.search.placeholder': 'Search ledger by name…',
  'ledgers.recent.title': 'Recently Used Ledgers',
  'ledgers.empty': 'No ledgers with transactions yet.',
  'ledgers.openLedgerButton': 'Open Ledger',

  // Reports – headers & modes
  'reports.header.title': 'Reports',
  'reports.header.subtitle':
    'Trial balance, Profit & Loss and Balance Sheet.',
  'reports.modes.overall': 'Overall',
  'reports.modes.monthly': 'Monthly',
  'reports.modes.yearly': 'Yearly',
  'reports.period.overall': 'All Transactions',
  'reports.period.monthly': 'This Month',
  'reports.period.yearly': 'This Year',

  // Reports – Trial Balance
  'reports.trial.title': 'Trial Balance',
  'reports.trial.noData': 'No transactions yet.',
  'reports.trial.total': 'TOTAL',

  // Reports – Profit & Loss
  'reports.pl.title': 'Profit & Loss Account',
  'reports.pl.noData': 'No income / expense data yet.',
  'reports.pl.expenses': 'Expenses (Dr)',
  'reports.pl.incomes': 'Incomes (Cr)',
  'reports.pl.totalExpenses': 'Total Expenses',
  'reports.pl.totalIncomes': 'Total Incomes',
  'reports.pl.netProfit': 'Net Profit',
  'reports.pl.netLoss': 'Net Loss',

  // Reports – Balance Sheet
  'reports.bs.title': 'Balance Sheet',
  'reports.bs.noData': 'No assets / liabilities yet.',
  'reports.bs.liabilities': 'Liabilities',
  'reports.bs.assets': 'Assets',
  'reports.bs.totalLiabilities': 'Total Liabilities',
  'reports.bs.totalAssets': 'Total Assets',

  // Reports – Planned
  'reports.planned.title': 'Planned Reports',
  'reports.planned.plTitle': 'Profit & Loss',
  'reports.planned.plText':
    'Detailed period-wise P&L with groups (Sales, Purchases, etc).',
  'reports.planned.bsTitle': 'Balance Sheet',
  'reports.planned.bsText':
    'Assets / Liabilities / Capital with schedules.',
  'reports.planned.cashTitle': 'Cash Flow',
  'reports.planned.cashText':
    'Movement in cash / bank ledgers consolidated.',
  'reports.planned.ledgerTitle': 'Ledger Analysis',
  'reports.planned.ledgerText':
    'Turnover & balances per ledger with graphs.',
};

const ja: typeof en = {
  // Tabs
  'tabs.entries': '仕訳',
  'tabs.home': 'ホーム',
  'tabs.ledgers': '元帳',
  'tabs.reports': 'レポート',
  'tabs.settings': '設定',

  // Settings
  'settings.title': '設定',
  'settings.subtitle':
    'アプリの基本設定、言語、今後のバックアップ・同期など。',
  'settings.language.title': '表示言語',
  'settings.language.hint': 'アプリ画面で使用する言語を選択してください。',
  'settings.language.current.en': '現在: 英語',
  'settings.language.current.ja': '現在: 日本語',
  'settings.language.info':
    '順番に画面のテキストを多言語対応していきます。',
  'settings.data.title': 'データ・バックアップ',
  'settings.data.hint': '現在のところ、すべてのデータはこの端末内に保存されています。',
  'settings.data.info':
    '今後はクラウド連携（PostgreSQL / Firebase など）を実装し、複数端末で帳簿を共有できるようにします。',
  'settings.about.title': 'このアプリについて',
  'settings.about.info':
    'Tally-for-Mobile（レジャー試作版）\nReact Native + Expo で作成。\n複式簿記、元帳表示、試算表、損益計算書、貸借対照表が動作中です。',

  // Home
  'home.title': 'ダッシュボード',
  'home.subtitle': '帳簿のざっくり状況を確認。',
  'home.card.quickEntry.title': '仕訳入力',
  'home.card.quickEntry.text':
    '現金出納帳または振替伝票をすぐに登録。',
  'home.card.ledgers.title': '元帳',
  'home.card.ledgers.text':
    '取引先・経費・収益・資産・負債などの元帳を検索。',
  'home.card.reports.title': 'レポート',
  'home.card.reports.text':
    '試算表・損益計算書・貸借対照表をまとめて表示。',
  'home.recentEntries.title': '最近の仕訳',
  'home.recentEntries.empty':
    'まだ仕訳が登録されていません。まずは取引を1件登録してください。',

  // Entries
  'entries.header': '仕訳一覧',
  'entries.subtitle': '登録済みの仕訳を確認・新規登録。',
  'entries.addButton': '＋ 仕訳を追加',
  'entries.recent.title': 'すべての仕訳',
  'entries.empty': '仕訳はまだ登録されていません。',
  'entries.type.cashBook': '現金出納帳',
  'entries.type.journal': '振替仕訳',

  // Ledgers
  'ledgers.header': '元帳一覧',
  'ledgers.subtitle':
    '取引先や勘定科目（費用・収益・資産・負債）を検索。',
  'ledgers.search.placeholder': '元帳名で検索…',
  'ledgers.recent.title': '最近使用した元帳',
  'ledgers.empty': '取引のある元帳がまだありません。',
  'ledgers.openLedgerButton': '元帳を表示',

  // Reports – headers & modes
  'reports.header.title': 'レポート',
  'reports.header.subtitle':
    '試算表、損益計算書、貸借対照表を確認。',
  'reports.modes.overall': '全期間',
  'reports.modes.monthly': '月次',
  'reports.modes.yearly': '年次',
  'reports.period.overall': '全ての取引',
  'reports.period.monthly': '今月',
  'reports.period.yearly': '今年',

  // Reports – Trial Balance
  'reports.trial.title': '試算表',
  'reports.trial.noData': 'まだ取引が登録されていません。',
  'reports.trial.total': '合計',

  // Reports – Profit & Loss
  'reports.pl.title': '損益計算書',
  'reports.pl.noData': '収益・費用のデータがまだありません。',
  'reports.pl.expenses': '費用（借方）',
  'reports.pl.incomes': '収益（貸方）',
  'reports.pl.totalExpenses': '費用合計',
  'reports.pl.totalIncomes': '収益合計',
  'reports.pl.netProfit': '当期純利益',
  'reports.pl.netLoss': '当期純損失',

  // Reports – Balance Sheet
  'reports.bs.title': '貸借対照表',
  'reports.bs.noData': '資産・負債のデータがまだありません。',
  'reports.bs.liabilities': '負債・純資産',
  'reports.bs.assets': '資産',
  'reports.bs.totalLiabilities': '負債・純資産合計',
  'reports.bs.totalAssets': '資産合計',

  // Reports – Planned
  'reports.planned.title': '今後追加予定のレポート',
  'reports.planned.plTitle': '損益計算書（詳細）',
  'reports.planned.plText':
    '売上・仕入などのグループ別に期間比較できる損益計算書。',
  'reports.planned.bsTitle': '貸借対照表（詳細）',
  'reports.planned.bsText':
    '資産・負債・純資産を内訳付きで表示。',
  'reports.planned.cashTitle': 'キャッシュフロー',
  'reports.planned.cashText':
    '現金・預金の増減をまとめて表示。',
  'reports.planned.ledgerTitle': '元帳分析',
  'reports.planned.ledgerText':
    '勘定科目ごとの回転率・残高推移などをグラフ化。',
};

export type LabelKey = keyof typeof en;
type Lang = 'en' | 'ja';

const translations: Record<Lang, Record<LabelKey, string>> = {
  en,
  ja,
};

export function useT() {
  const { settings } = useSettings();
  const lang: Lang = settings.language;

  return (key: LabelKey): string => {
    const current = translations[lang][key];
    if (current) return current;
    return translations.en[key] ?? key;
  };
}

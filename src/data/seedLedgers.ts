// src/data/seedLedgers.ts
import type { Ledger } from '../models/ledger';

/**
 * Full pre-loaded chart of accounts:
 * - Trading & Profit and Loss (Income Statement)
 * - Balance Sheet (Assets / Liabilities / Equity)
 *
 * Parties (customers/suppliers/loans) tum khud addLedger se banao.
 */
export const seedLedgers: Ledger[] = [
  // ===== EQUITY / CORE =====
  {
  id: 'L0',
  name: 'Opening Balances A/C',
  groupName: 'Capital Account',
  nature: 'Liability',
  isParty: false,
},
  {
    id: 'L1',
    name: 'Capital A/C',
    groupName: 'Capital Account',
    nature: 'Liability',
    isParty: false,
  },
  {
    id: 'L2',
    name: 'Drawings A/C',
    groupName: 'Capital Account',
    nature: 'Asset', // Contra to capital, shown on asset side
    isParty: false,
  },
  {
    id: 'L3',
    name: 'Reserves & Surplus A/C',
    groupName: 'Reserves & Surplus',
    nature: 'Liability',
    isParty: false,
  },
  {
    id: 'L4',
    name: 'Profit & Loss A/C',
    groupName: 'Profit & Loss',
    nature: 'Liability', // closing P&L if needed
    isParty: false,
  },

  // ===== CASH / BANK =====
  {
    id: 'L10',
    name: 'Cash in Hand A/C',
    groupName: 'Cash-in-Hand',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L11',
    name: 'Cash at Bank A/C',
    groupName: 'Bank Accounts',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L12',
    name: 'Bank Overdraft A/C',
    groupName: 'Bank Accounts',
    nature: 'Liability',
    isParty: false,
  },

  // ===== TRADING / P&L : SALES SIDE =====
  {
    id: 'L20',
    name: 'Sales A/C',
    groupName: 'Sales Accounts',
    nature: 'Income',
    isParty: false,
  },
  {
    id: 'L21',
    name: 'Sales Returns A/C',
    groupName: 'Sales Accounts',
    nature: 'Expense', // contra-income
    isParty: false,
  },

  // ===== TRADING / P&L : PURCHASE SIDE =====
  {
    id: 'L22',
    name: 'Purchases A/C',
    groupName: 'Purchase Accounts',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L23',
    name: 'Purchase Returns A/C',
    groupName: 'Purchase Accounts',
    nature: 'Income', // contra-expense
    isParty: false,
  },

  // ===== STOCK =====
  {
    id: 'L24',
    name: 'Opening Stock A/C',
    groupName: 'Inventory',
    nature: 'Expense', // Trading Dr side
    isParty: false,
  },
  {
    id: 'L25',
    name: 'Closing Stock A/C',
    groupName: 'Inventory',
    nature: 'Asset',
    isParty: false,
  },

  // ===== DIRECT EXPENSES (TRADING) =====
  {
    id: 'L30',
    name: 'Wages A/C',
    groupName: 'Direct Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L31',
    name: 'Carriage Inward / Freight on Purchases A/C',
    groupName: 'Direct Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L32',
    name: 'Fuel & Power A/C',
    groupName: 'Direct Expenses',
    nature: 'Expense',
    isParty: false,
  },

  // ===== INDIRECT EXPENSES (P&L) =====
  {
    id: 'L40',
    name: 'Rent Paid A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L41',
    name: 'Salaries A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L42',
    name: 'Interest Paid A/C',
    groupName: 'Finance Charges',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L43',
    name: 'Commission Paid A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L44',
    name: 'Discount Allowed A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L45',
    name: 'Bad Debts A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L46',
    name: 'Depreciation A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L47',
    name: 'Repairs & Maintenance A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L48',
    name: 'Advertising & Promotion A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L49',
    name: 'Insurance A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L50',
    name: 'Electricity A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L51',
    name: 'Telephone & Internet A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L52',
    name: 'Travel Expenses A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L53',
    name: 'Office Expenses A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L54',
    name: 'Printing & Stationery A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L55',
    name: 'Legal Fees A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L56',
    name: 'Audit Fees A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L57',
    name: 'Loss on Sale of Asset A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L58',
    name: 'Provision for Doubtful Debts A/C',
    groupName: 'Indirect Expenses',
    nature: 'Expense',
    isParty: false,
  },
  {
    id: 'L59',
    name: 'Bank Charges A/C',
    groupName: 'Finance Charges',
    nature: 'Expense',
    isParty: false,
  },

  // ===== INDIRECT INCOMES (P&L) =====
  {
    id: 'L70',
    name: 'Rent Received A/C',
    groupName: 'Indirect Incomes',
    nature: 'Income',
    isParty: false,
  },
  {
    id: 'L71',
    name: 'Interest Received A/C',
    groupName: 'Indirect Incomes',
    nature: 'Income',
    isParty: false,
  },
  {
    id: 'L72',
    name: 'Commission Received A/C',
    groupName: 'Indirect Incomes',
    nature: 'Income',
    isParty: false,
  },
  {
    id: 'L73',
    name: 'Discount Received A/C',
    groupName: 'Indirect Incomes',
    nature: 'Income',
    isParty: false,
  },
  {
    id: 'L74',
    name: 'Gain on Sale of Asset A/C',
    groupName: 'Indirect Incomes',
    nature: 'Income',
    isParty: false,
  },

  // ===== BALANCE SHEET : FIXED / INTANGIBLE ASSETS =====
  {
    id: 'L80',
    name: 'Goodwill A/C',
    groupName: 'Intangible Assets',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L81',
    name: 'Patents & Copyrights A/C',
    groupName: 'Intangible Assets',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L82',
    name: 'Land A/C',
    groupName: 'Fixed Assets',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L83',
    name: 'Building A/C',
    groupName: 'Fixed Assets',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L84',
    name: 'Plant & Machinery A/C',
    groupName: 'Fixed Assets',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L85',
    name: 'Machinery A/C',
    groupName: 'Fixed Assets',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L86',
    name: 'Furniture & Fixtures A/C',
    groupName: 'Fixed Assets',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L87',
    name: 'Motor Vehicles A/C',
    groupName: 'Fixed Assets',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L88',
    name: 'Leasehold Property A/C',
    groupName: 'Fixed Assets',
    nature: 'Asset',
    isParty: false,
  },

  // ===== BALANCE SHEET : INVESTMENTS / LOANS GIVEN =====
  {
    id: 'L90',
    name: 'Investments (Long-term) A/C',
    groupName: 'Investments',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L91',
    name: 'Investments (Current) A/C',
    groupName: 'Investments',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L92',
    name: 'Loans & Advances Given A/C',
    groupName: 'Loans & Advances',
    nature: 'Asset',
    isParty: false,
  },

  // ===== BALANCE SHEET : CURRENT ASSETS =====
  {
    id: 'L100',
    name: 'Debtors / Accounts Receivable A/C',
    groupName: 'Sundry Debtors',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L101',
    name: 'Bills Receivable A/C',
    groupName: 'Bills Receivable',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L102',
    name: 'Prepaid Expenses A/C',
    groupName: 'Current Assets',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L103',
    name: 'Advance Payments A/C',
    groupName: 'Current Assets',
    nature: 'Asset',
    isParty: false,
  },
  {
    id: 'L104',
    name: 'Stock / Inventory A/C',
    groupName: 'Inventory',
    nature: 'Asset',
    isParty: false,
  },

  // ===== BALANCE SHEET : LIABILITIES =====
  {
    id: 'L110',
    name: 'Bank Loan A/C',
    groupName: 'Secured Loans',
    nature: 'Liability',
    isParty: false,
  },
  {
    id: 'L111',
    name: 'Long-term Loans A/C',
    groupName: 'Secured Loans',
    nature: 'Liability',
    isParty: false,
  },
  {
    id: 'L112',
    name: 'Debentures A/C',
    groupName: 'Secured Loans',
    nature: 'Liability',
    isParty: false,
  },
  {
    id: 'L113',
    name: 'Creditors / Accounts Payable A/C',
    groupName: 'Sundry Creditors',
    nature: 'Liability',
    isParty: false,
  },
  {
    id: 'L114',
    name: 'Bills Payable A/C',
    groupName: 'Bills Payable',
    nature: 'Liability',
    isParty: false,
  },
  {
    id: 'L115',
    name: 'Outstanding Expenses A/C',
    groupName: 'Current Liabilities',
    nature: 'Liability',
    isParty: false,
  },
  {
    id: 'L116',
    name: 'Interest Due A/C',
    groupName: 'Current Liabilities',
    nature: 'Liability',
    isParty: false,
  },
  {
    id: 'L117',
    name: 'Provision for Taxation A/C',
    groupName: 'Provisions',
    nature: 'Liability',
    isParty: false,
  },
  {
    id: 'L118',
    name: 'Provision for Depreciation A/C',
    groupName: 'Provisions',
    nature: 'Liability',
    isParty: false,
  },

  // ===== EXAMPLE PARTY / LOAN LEDGER =====
  {
    id: 'L200',
    name: 'Bhuwan Loan A/C',
    groupName: 'Loans & Advances',
    nature: 'Liability',
    isParty: true,
  },
];

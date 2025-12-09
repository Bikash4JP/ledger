// src/data/seedTransactions.ts
import type { Transaction } from '../models/transaction';

export const seedTransactions: Transaction[] = [
  {
    id: 't1',
    voucherType: 'Receipt',
    date: '2025-12-01',
    debitLedgerId: 'L2', // Main Bank
    creditLedgerId: 'L3', // Bhuwan Loan
    amount: 100000,
    narration: 'Loan received from Bhuwan to Main Bank',
  },
  {
    id: 't2',
    voucherType: 'Payment',
    date: '2025-12-02',
    debitLedgerId: 'L3', // Bhuwan Loan
    creditLedgerId: 'L1', // Cash
    amount: 20000,
    narration: 'Part loan repayment to Bhuwan in cash',
  },
];

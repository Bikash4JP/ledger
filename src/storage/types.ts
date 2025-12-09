// src/storage/types.ts
import type { Ledger } from '../models/ledger';
import type { Transaction, VoucherType } from '../models/transaction';

// Yahan pe alag VoucherType define NAHI karna.
// models/transaction ka hi VoucherType reuse kar rahe hain.

export type EntryLineInput = {
  debitLedgerId: string;
  creditLedgerId: string;
  amount: number;
  narration?: string;
};

export type EntryInput = {
  date: string;            // 'YYYY-MM-DD'
  voucherType: VoucherType;
  narration?: string;
  lines: EntryLineInput[];
};

export interface IStorage {
  // App start pe saara data load
  loadInitialData(): Promise<{
    ledgers: Ledger[];
    transactions: Transaction[];
  }>;

  // Naya ledger create
  createLedger(input: {
    name: string;
    groupName: string;
    nature: 'Asset' | 'Liability' | 'Income' | 'Expense';
    isParty?: boolean;
  }): Promise<Ledger>;

  // Naya entry (voucher) create
  createEntry(input: EntryInput): Promise<{
    ledgers: Ledger[];
    transactions: Transaction[];
  }>;
}

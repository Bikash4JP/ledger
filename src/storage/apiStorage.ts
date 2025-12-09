// src/storage/apiStorage.ts
import type { IStorage, EntryInput } from './types';
import type { Ledger } from '../models/ledger';
import type { Transaction } from '../models/transaction';
import {
  apiGetLedgers,
  apiGetTransactions,
  apiCreateLedger,
  apiCreateEntry,
} from './apiClient';

/**
 * Backend-based storage implementation.
 * Yahan se saare data calls Node/Postgres backend pe jaayenge.
 */
export const apiStorage: IStorage = {
  // App load hone par initial data
  async loadInitialData(): Promise<{
    ledgers: Ledger[];
    transactions: Transaction[];
  }> {
    const [ledgersRaw, transactionsRaw] = await Promise.all([
      apiGetLedgers(),
      apiGetTransactions(),
    ]);

    const ledgers = ledgersRaw as Ledger[];
    const transactions = transactionsRaw as Transaction[];

    return { ledgers, transactions };
  },

  // Naya ledger create
  async createLedger(input: {
    name: string;
    groupName: string;
    nature: 'Asset' | 'Liability' | 'Income' | 'Expense';
    isParty?: boolean;
  }): Promise<Ledger> {
    const created = await apiCreateLedger(input);
    return created as Ledger;
  },

  // Naya entry (voucher) create
  async createEntry(input: EntryInput): Promise<{
    ledgers: Ledger[];
    transactions: Transaction[];
  }> {
    // 1) backend me entry create karo
    await apiCreateEntry({
      date: input.date,
      voucherType: input.voucherType,
      narration: input.narration,
      lines: input.lines,
    });

    // 2) fresh data reload karo (simple & safe)
    const [ledgersRaw, transactionsRaw] = await Promise.all([
      apiGetLedgers(),
      apiGetTransactions(),
    ]);

    const ledgers = ledgersRaw as Ledger[];
    const transactions = transactionsRaw as Transaction[];

    return { ledgers, transactions };
  },
};

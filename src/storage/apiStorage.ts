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
 * All data calls go through the Node/Postgres backend.
 */
export const apiStorage: IStorage = {
  // Load initial data on app start
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

  // Create a new ledger
  async createLedger(input: {
    name: string;
    groupName: string;
    nature: 'Asset' | 'Liability' | 'Income' | 'Expense';
    isParty?: boolean;
  }): Promise<Ledger> {
    const created = await apiCreateLedger(input);
    return created as Ledger;
  },

  // Create a new entry (voucher)
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

    // 2) Reload fresh data (simple and safe)
    const [ledgersRaw, transactionsRaw] = await Promise.all([
      apiGetLedgers(),
      apiGetTransactions(),
    ]);

    const ledgers = ledgersRaw as Ledger[];
    const transactions = transactionsRaw as Transaction[];

    return { ledgers, transactions };
  },
};

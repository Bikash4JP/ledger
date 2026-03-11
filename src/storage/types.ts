// ledger/src/storage/types.ts
import type { Ledger } from '../models/ledger';
import type { VoucherType } from '../models/transaction';

/** Entry create payload */
export type EntryLineInput = {
  debitLedgerId: string;
  creditLedgerId: string;
  amount: number;
  narration?: string;
};

export type EntryInput = {
  date: string;
  voucherType: VoucherType;
  narration?: string;
  lines: EntryLineInput[];
};

/**
 * Ledger create/update payload
 * (Front-end -> Backend)
 */
export type LedgerInput = {
  name: string;
  groupName: string;
  nature: Ledger['nature'];
  isParty?: boolean;

  isGroup?: boolean;
  parentLedgerId?: string | null;
};

/** Storage adapter interface */
export type IStorage = {
  loadInitialData(): Promise<{ ledgers: Ledger[]; transactions: import('../models/transaction').Transaction[] }>;
  createLedger(input: LedgerInput): Promise<Ledger>;
  createEntry(input: EntryInput): Promise<{ ledgers: Ledger[]; transactions: import('../models/transaction').Transaction[] }>;
};

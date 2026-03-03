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
 * ✅ Ledger create/update payload
 * (Front-end -> Backend)
 */
export type LedgerInput = {
  name: string;
  groupName: string;
  nature: Ledger['nature'];
  isParty?: boolean;

  // ✅ NEW: parent category support
  isGroup?: boolean;
  parentLedgerId?: string | null;
};

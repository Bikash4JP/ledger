// src/models/transaction.ts
export type VoucherType =
  | 'Receipt'
  | 'Payment'
  | 'Journal'
  | 'Contra'
  | 'Sales'
  | 'Purchase';

export type Transaction = {
  id: string;
  voucherType: VoucherType;
  date: string; // YYYY-MM-DD
  debitLedgerId: string;
  creditLedgerId: string;
  amount: number;
  narration?: string;
};

// src/models/ledger.ts
export type LedgerNature = 'Asset' | 'Liability' | 'Income' | 'Expense';

export type Ledger = {
  id: string;
  name: string;
  groupName: string;
  nature: LedgerNature;
  isParty?: boolean;
};

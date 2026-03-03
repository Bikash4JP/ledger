// ledger/src/models/ledger.ts
export type LedgerNature = 'Asset' | 'Liability' | 'Income' | 'Expense';

export type Ledger = {
  id: string;
  name: string;
  groupName: string;
  nature: LedgerNature;
  isParty?: boolean;

  // ✅ parent support (DB/back-end naming)
  categoryLedgerId?: string | null; // child -> parent ledger id (category_ledger_id)
  isGroup?: boolean;                // true = parent/group ledger
};

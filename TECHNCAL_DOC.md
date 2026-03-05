# MobiLedger - Technical Documentation

## 1. Architecture Overview
MobiLedger follows a **Context-Provider pattern** for state management and **Expo Router** for file-based navigation.

### Directory Structure
- `/app`: Contains the UI screens.
    - `/(tabs)`: Main navigation hub (Entries, Ledgers, Reports, Settings).
    - `/ledger/[id].tsx`: Dynamic route for specific account statements and PDF generation.
    - `/entry/new.tsx`: Entry logic for Cash Book and Journal transactions.
- `/src/context`: Global state (Data, Auth, Settings).
- `/src/utils`: Business logic, specifically `ledgerLabels.ts` for translation mapping.
- `/src/i18n`: Scoped UI translations using the `useT()` hook.

## 2. Core Modules

### A. Localization Engine (`src/utils/ledgerLabels.ts`)
The app uses a "Dictionary Lookup" strategy. 
- **Standard Ledgers**: Names like "Sales" or "Cash" are mapped to Japanese equivalents.
- **Dynamic Ledgers**: User-created ledgers remain in the language they were entered.
- **Nature/Group**: Accounting categories (Asset, Liability, etc.) are translated via `getNatureLabel()` and `getGroupLabel()`.

### B. Accounting Logic (`app/(tabs)/reports.tsx`)
Financial reports are calculated dynamically from the transaction array:
1.  **Trial Balance**: Aggregates Dr/Cr for every ledger.
2.  **P&L**: Filters Trial Balance by 'Income' and 'Expense' natures.
3.  **Balance Sheet**: Filters by 'Asset' and 'Liability' natures, incorporating Net Profit/Loss.
*Fixed: Date parsing uses string splitting to avoid UTC/Local timezone offsets.*

### C. PDF Generation (`app/ledger/[id].tsx`)
Uses `expo-print` to convert HTML strings into PDF files.
- **Filename Logic**: Files are saved using the format `AccountName_YYYYMMDD_HHMMSS.pdf`.
- **Implementation**: Uses `FileSystem.cacheDirectory` and `FileSystem.moveAsync` to rename the temporary print file before triggering `Sharing.shareAsync`.

## 3. Implementation Details

### Handling High-Version TypeScript
Due to the bleeding-edge React 19/TS 5.9 environment, `expo-file-system` constants are accessed using a namespace strategy:
```typescript
import * as FileSystem from 'expo-file-system';
const fs: any = FileSystem; // Bypassing strict namespace export check
const uri = fs.cacheDirectory + fileName;
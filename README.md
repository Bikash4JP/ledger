# MobiLedger 📱💼

**MobiLedger** is a professional, bilingual accounting and transaction management application built with React Native and Expo. It transforms daily financial entries into automated, comprehensive accounting books.

## 🌟 Key Features

* **Dual Entry Modes**: Simplified **Cash Book** for daily tracking and full **Journal** entries for complex accounting.
* **Automated Financial Reporting**:
    * **Trial Balance**: Real-time overview of ledger balances.
    * **Profit & Loss (P&L)**: Automatic calculation of net performance.
    * **Balance Sheet**: Accurate tracking of Assets and Liabilities.
    * **Cash Flow**: Insights into cash and bank movement.
* **Comprehensive Ledger Management**: Categorize accounts into Assets, Liabilities, Incomes, and Expenses.
* **Bilingual Support (EN/JA)**: Fully localized interface with standard accounting terms translated between English and Japanese.
* **Professional PDF Export**: Export detailed ledger statements as professional PDF documents.
* **Cloud Sync**: Secure authentication to sync data across devices.

## 🚀 Tech Stack & Versions

### Core Frameworks
* **Expo**: `~54.0.30`
* **React Native**: `0.81.5`
* **React**: `19.1.0`
* **TypeScript**: `~5.9.2`

### Navigation & Routing
* **Expo Router**: `~6.0.18`
* **React Navigation**:
    * `bottom-tabs`: `^7.8.11`
    * `native`: `^7.1.24`
    * `native-stack`: `^7.8.5`

### UI & Utilities
* **DateTime Picker**: `@react-native-community/datetimepicker: 8.4.4`
* **Vector Icons**: `@expo/vector-icons: ^15.0.3`
* **Safe Area Context**: `react-native-safe-area-context: ~5.6.0`
* **Reanimated**: `react-native-reanimated: ~4.1.1`

### System Services
* **File System**: `expo-file-system: ~19.0.21`
* **Print Service**: `expo-print: ~15.0.8`
* **Sharing Service**: `expo-sharing: ~14.0.8`
* **Async Storage**: `@react-native-async-storage/async-storage: 2.2.0`

## 📂 Project Structure

```text
├── app/                  # Expo Router directory (screens & navigation)
│   ├── (tabs)/           # Main navigation (Entries, Ledgers, Reports, Settings)
│   ├── entry/            # Transaction entry screens
│   └── ledger/           # Ledger statements and Master editor
├── src/                  # Source code
│   ├── api/              # Auth client and backend services
│   ├── context/          # State management (AppData, Settings, Auth)
│   ├── i18n/             # Localization (labels and hooks)
│   ├── models/           # TypeScript interfaces
│   ├── screens/          # Reusable UI components
│   └── utils/            # Translation helpers and accounting logic
└── package.json          # Project configuration and dependencies
```

## 🛠️ Getting Started

1.  **Clone and Install**:
    ```bash
    git clone https://github.com/Bikash4JP/ledger.git
    cd mobiledger
    npm install
    ```

2.  **Fix Dependencies** (if needed):
    ```bash
    npx expo install --check
    ```

3.  **Run Development Server**:
    ```bash
    npx expo start -c
    ```

## 👤 Author

* **ＢＩＫＡＳＨ　ＴＨＡＰＡ** - *Lead Developer & Designer*

---
*This project is built forindividual / professional financial tracking and is currently in its pre-release version.*
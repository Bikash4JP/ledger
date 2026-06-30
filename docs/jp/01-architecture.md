# MobiLedger — システムアーキテクチャ

---

## 1. システム全体図

```
┌─────────────────────────────────────────────────────────────────┐
│                    クライアント（モバイル / Web）                 │
│                                                                 │
│  ┌─────────────┐   ┌──────────────────┐   ┌──────────────────┐ │
│  │ Expo Router │   │  コンテキスト層   │   │    UI画面        │ │
│  │（ナビゲーション）├─▶│ SettingsContext │─▶│  (tabs/, entry/, │ │
│  │              │   │ AppDataContext  │   │   ledger/)       │ │
│  │              │   │ UiContext       │   │                  │ │
│  └─────────────┘   └────────┬─────────┘   └──────────────────┘ │
│                             │                                   │
│                    ┌────────▼─────────┐                         │
│                    │  ストレージ層     │                         │
│                    │ apiClient.ts     │                         │
│                    │ apiStorage.ts    │                         │
│                    └────────┬─────────┘                         │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTP  (x-user-email ヘッダー)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    バックエンド（ledback）                        │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │  /auth       │   │  /ledgers    │   │  /entries        │    │
│  │  signup      │   │  CRUD        │   │  CRUD            │    │
│  │  login       │   │  statement   │   │  /transactions   │    │
│  └──────────────┘   └──────────────┘   └──────────────────┘    │
│                             │                                   │
│                    ┌────────▼─────────┐                         │
│                    │   データベース    │                         │
│                    │ (PostgreSQL /    │                         │
│                    │  SQLite)         │                         │
│                    └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. フロントエンドアーキテクチャ

### ナビゲーション層 — Expo Router

MobiLedgerは **ファイルベースのルーティング** をExpo Routerで実現しています。ファイル構造がそのままURLルートに対応します：

```
app/
├── _layout.tsx          → ルートレイアウト（全プロバイダーをラップ）
├── (tabs)/
│   ├── _layout.tsx      → ボトムタブバーの定義
│   ├── index.tsx        → / （ホーム/ダッシュボード）
│   ├── entries.tsx      → /entries
│   ├── ledgers.tsx      → /ledgers
│   ├── reports.tsx      → /reports
│   └── setting.tsx      → /setting
├── entry/
│   ├── new.tsx          → /entry/new
│   └── [id].tsx         → /entry/:id
└── ledger/
    └── [id].tsx         → /ledger/:id
```

### 状態管理 — コンテキストプロバイダー

3つのReact Contextプロバイダーが `app/_layout.tsx` で初期化され、アプリ全体をラップします：

| コンテキスト | ファイル | 役割 |
|---|---|---|
| `SettingsContext` | `src/context/SettingsContext.tsx` | 言語・テーマ・認証プロフィール（AsyncStorageに永続化） |
| `AppDataContext` | `src/context/AppDataContext.tsx` | 全元帳・取引データ、CRUD操作、デモ/ユーザーモード切替 |
| `UiContext` | `src/context/UiContext.tsx` | 一時的なUI状態（モーダル表示・ローディングフラグ） |

### データフロー

```
アプリ起動
    │
    ▼
SettingsContext.init()
    │  → AsyncStorageキー: @ledger_settings_v2 を読み込み
    │  → 言語・authProfileを復元
    │
    ▼
AppDataContext.init()
    │
    ├── authProfile === null ?
    │       YES → seedLedgers（56件）+ seedTransactions を読み込み（デモモード）
    │       NO  → apiStorage.loadInitialData()
    │                   → GET /ledgers   （x-user-email ヘッダー付き）
    │                   → GET /entries
    │
    ▼
UIが useData() + useSettings() フックで状態を表示
    │
    ▼
ユーザーがCRUD操作（取引・元帳の追加/編集/削除）
    │
    ├── AppDataContext の関数を呼び出し（例：addTransaction）
    │       → POST /entries
    │       → loadInitialData() で状態をリフレッシュ
    │
    ▼
UIが更新された状態で再レンダリング
```

---

## 3. 認証モデル

MobiLedgerは **メールアドレスベースのヘッダー認証**（JWTトークンなし）を採用しています：

- ログイン時、バックエンドは認証情報を検証して `AuthUser` オブジェクトを返します。
- ユーザーのメールアドレスは `SettingsContext.authProfile` に保存され（AsyncStorageに永続化）。
- `userIdentity.ts` シングルトンがセッション中のメールアドレスをメモリに保持します。
- 全APIリクエストに以下のヘッダーを付与：`x-user-email: <user@email.com>`
- バックエンドはこのヘッダーを使って、認証ユーザーのデータのみをスコープします。

> **セキュリティ注記：** このモデルは信頼されたモバイルクライアントに適しています。本番環境ではJWTトークン検証の追加を検討してください。

---

## 4. 会計エンジン

全財務レポートは **クライアント上で `app/(tabs)/reports.tsx` 内に動的計算**されます。集計済みデータはサーバーに保存されません。

### 試算表アルゴリズム

```
全取引を処理：
    借方元帳残高 += 取引金額
    貸方元帳残高 -= 取引金額

検証：借方合計 === 貸方合計
```

### 損益計算書

```
収益勘定  → 貸方残高 = 収入
費用勘定  → 借方残高 = コスト

売上総利益 = 売上高 − 売上原価
当期純利益 = 売上総利益 − 販管費 + その他収益
```

### 貸借対照表

```
資産     = 資産性質の元帳残高合計
負債     = 負債性質の元帳残高合計 + 資本
資本    += 当期純利益（P&L より）

検証：資産 === 負債
```

> **日付処理の注記：** モバイル端末でのUTC/ローカルタイムゾーンのずれを避けるため、`new Date()` ではなく文字列分割（`date.split('-')`）を使用しています。

---

## 5. ストレージとAPIレイヤー

### `src/storage/apiClient.ts`

汎用HTTPクライアントラッパー。全リクエストに：
- `Content-Type: application/json` を設定
- `userIdentity` シングルトンから `x-user-email` ヘッダーを注入
- `process.env.EXPO_PUBLIC_API_URL` をベースURLとして使用

### `src/storage/apiStorage.ts`

アプリケーションレベルの操作（`loadInitialData`、`createLedger`、`createEntry`）を `apiClient.ts` の生API呼び出しに変換するアダプター。`AppDataContext` はこのアダプターを通じてのみAPIを呼び出します。

---

## 6. 多言語対応（i18n）

### 2層構造の翻訳システム

**第1層 — 勘定科目名**（`src/utils/ledgerLabels.ts`）：
60件以上の標準会計用語の辞書ルックアップ（例：「Cash in Hand」→「現金」）。

**第2層 — UIテキスト**（`src/i18n/labels.ts`）：
全ボタンラベル・タブ名・エラーメッセージ・フォームラベル。

### ルール

`seedLedgers.ts` に含まれる標準勘定科目のみ辞書で翻訳されます。ユーザーが作成したカスタム勘定科目は、**入力された言語のまま表示され、自動翻訳されません。**

---

## 7. PDFエクスポートパイプライン

```
ユーザーが /ledger/:id で「PDFエクスポート」をタップ
    │
    ▼
HTML文字列を生成（元帳明細テーブル全体）
    │
    ▼
expo-print.printToFileAsync({ html })
    → 返り値：file:///tmp/expo-print-XXXX.pdf
    │
    ▼
FileSystem.moveAsync()
    → リネーム：CacheDir/勘定科目名_YYYYMMDD_HHMMSS.pdf
    │
    ▼
Sharing.shareAsync(namedUri)
    → ネイティブ共有シートを開く（保存・メール・AirDrop等）
```

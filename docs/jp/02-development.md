# MobiLedger — 開発ガイド

---

## 前提条件

| ツール | 最低バージョン | インストール先 |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org |
| npm | 9以上 | Nodeに同梱 |
| Git | 最新版 | https://git-scm.com |
| Docker Desktop | 4.x | https://docker.com/products/docker-desktop（任意） |
| Expo Go アプリ | 最新版 | App Store / Play Store（実機テスト用） |

---

## 1. 両リポジトリをクローン

```bash
# ワークスペースフォルダを作成
mkdir mobiledger-workspace && cd mobiledger-workspace

# フロントエンド
git clone https://github.com/Bikash4JP/ledger.git

# バックエンド
git clone https://github.com/Bikash4JP/ledback.git
```

ワークスペースの構成：

```
mobiledger-workspace/
├── ledger/      ← このリポジトリ（フロントエンド）
└── ledback/     ← バックエンドAPI
```

---

## 2. フロントエンドのセットアップ

```bash
cd ledger

# 依存パッケージをインストール
npm install

# 環境変数テンプレートをコピー
cp .env.example .env
```

`.env` を編集してバックエンドURLを設定：

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> バックエンドを別のポートで動かす場合は適宜変更してください。

### 開発サーバーの起動

| モード | コマンド | 備考 |
|---|---|---|
| デフォルト（QRコード） | `npx expo start -c` | スマホのExpo Goで動作確認 |
| Webブラウザ | `npx expo start --web` | http://localhost:8081 で開く |
| Androidエミュレーター | `npx expo start --android` | Android Studio 必要 |
| iOSシミュレーター | `npx expo start --ios` | Xcode 必要（macOSのみ） |
| トンネル（リモートアクセス） | `npx expo start --tunnel` | インターネット越しにアクセス可 |

> **デモモード：** `EXPO_PUBLIC_API_URL` を設定しない、またはバックエンドを起動しない場合、アプリは56件の組み込み元帳とサンプル取引を使ったデモモードで動作します。UIの開発・確認にはバックエンドは不要です。

---

## 3. バックエンドのセットアップ（ledback）

```bash
cd ../ledback

# 依存パッケージをインストール
npm install

# 環境変数テンプレートをコピー
cp .env.example .env
```

データベース接続先やポートなどの詳細は `ledback` リポジトリの README を参照してください。

```bash
# バックエンド開発サーバーを起動
npm run dev
```

バックエンドAPIは `http://localhost:3000`（設定に応じて変わります）で起動します。

---

## 4. Dockerを使った開発（新しいPCに推奨）

新しいPCへの移行時は [03-docker-migration.md](03-docker-migration.md) を参照してください。Dockerを使った全スタックの立ち上げ方を説明しています。

---

## 5. 開発ワークフロー

### フロントエンドの変更箇所

| 変更内容 | 場所 |
|---|---|
| 画面・ページ | `app/(tabs)/`, `app/entry/`, `app/ledger/` |
| 共有UIコンポーネント | `components/` |
| 状態管理・ビジネスロジック | `src/context/` |
| API呼び出し | `src/storage/apiClient.ts` |
| 勘定科目名の翻訳 | `src/utils/ledgerLabels.ts` |
| UIテキストの翻訳 | `src/i18n/labels.ts` |
| データモデル | `src/models/` |
| シードデータ | `src/data/` |

### ホットリロード

Expo Metro BundlerはデフォルトでFast Refreshに対応しています。ファイルを保存すると数秒以内に変更がアプリに反映されます（多くの変更はフルリロード不要）。

### キャッシュのクリア

動作がおかしい場合やエラーが出る場合：

```bash
npx expo start -c   # -c でMetroキャッシュをクリア
```

---

## 6. TypeScript

TypeScript `~5.9.2`（strict mode）を使用しています。型チェックの実行：

```bash
npx tsc --noEmit
```

現在テストファイルはありません。TypeScriptコンパイルが主要な正確性チェックです。

---

## 7. 環境変数リファレンス

| 変数名 | 必須 | 説明 |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | クラウド同期時 | バックエンドAPIのベースURL（末尾スラッシュなし）。例：`http://192.168.1.10:3000` |

> `EXPO_PUBLIC_` プレフィックスは必須です。Expoはこのプレフィックスが付いた変数のみをクライアントバンドルに含めます。

---

## 8. よく使うコマンド

```bash
# 型チェックのみ（ビルドなし）
npx tsc --noEmit

# Expo SDKのバージョン不整合を確認
npx expo install --check

# Expo SDKをアップグレード
npx expo upgrade

# インストール済みパッケージ一覧
npm list --depth=0
```

---

## 9. コーディング規約

- **コメントは「なぜ」が自明でない場合のみ記述。** コードは命名で自己説明するのが原則。
- 状態の変更は必ず `AppDataContext` を経由して行う — 画面から直接 `apiClient.ts` を呼び出してはならない。
- 日付比較はすべて文字列分割（`date.split('-')[0]` 等）を使用 — ユーザー入力の日付文字列に `new Date()` を使わない。
- カスタム元帳名は自動翻訳しない — `getLedgerLabel()` を通すのはシード元帳のみ。

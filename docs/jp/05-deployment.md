# MobiLedger — ビルドとデプロイガイド

---

## 1. EASモバイルビルド（React Native）

MobiLedgerはネイティブiOS・Androidアプリのビルドに**Expo Application Services（EAS）**を使用します。

### 前提条件

```bash
npm install -g eas-cli
eas login    # Expoアカウントでログイン
```

### EASビルドプロファイル（`eas.json`）

| プロファイル | コマンド | 出力物 | 用途 |
|---|---|---|---|
| `development` | `eas build --profile development` | 開発クライアントAPK/IPA | 開発クライアントでのローカルテスト |
| `preview` | `eas build --profile preview` | APK（Androidの内部配布用） | QAテスター・社内配布 |
| `production` | `eas build --profile production` | AAB / IPA | App Store / Play Storeへの提出 |

### ビルドコマンド

```bash
# Androidプレビュービルド（APKとして直接インストール可能）
eas build --platform android --profile preview

# iOS開発ビルド
eas build --platform ios --profile development

# 本番ビルド（両プラットフォーム）
eas build --platform all --profile production
```

### アプリの識別子

| プラットフォーム | 識別子 |
|---|---|
| Android パッケージ名 | `com.bikudev.mobiledger` |
| EAS プロジェクトID | `c294a215-934e-4239-b46d-6af992cc82cd` |

---

## 2. EAS Update（OTAアップデート）

ネイティブコードを変更しないJavaScriptのみの修正は、App Storeのレビューなしにアップデートを配信できます：

```bash
eas update --branch production --message "P&L計算のバグ修正"
```

> OTAアップデートはJSバンドルの変更のみに対応しています。新しいネイティブ依存パッケージを追加したり、`app.json` のプラグインを変更した場合は、フルビルド（`eas build`）が必要です。

---

## 3. 本番ビルド用の環境変数設定

本番ビルド前に、EASにバックエンドURLを設定します：

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-production-api.com
```

または `eas.json` の `production` プロファイルの `env` ブロックに設定することもできます。

---

## 4. バックエンドのデプロイ（ledback）

バックエンド（`ledback`）は独立したNode.jsアプリケーションです。推奨ホスティングオプション：

### オプションA — Railway（最もシンプル）

1. `ledback` をGitHubにpush。
2. https://railway.app でプロジェクトを作成。
3. `ledback` リポジトリを接続。
4. Railwayが自動的にNode.jsを検出してデプロイ。
5. Railwayダッシュボードで環境変数を設定。
6. 生成されたURL（例：`https://ledback.up.railway.app`）を `EXPO_PUBLIC_API_URL` に設定。

### オプションB — Render

1. https://render.com にアクセス。
2. New → Web Service → `ledback` リポジトリを接続。
3. ビルドコマンド：`npm install`
4. 起動コマンド：`npm start`
5. 環境変数を追加。
6. 無料プランあり（非アクティブ時はスリープ）。

### オプションC — 自前VPS（Ubuntu + PM2）

```bash
# VPS上で実行
git clone https://github.com/Bikash4JP/ledback.git
cd ledback
npm install
cp .env.example .env
# .env に本番用の値を入力

# PM2プロセスマネージャーをインストール
npm install -g pm2
pm2 start npm --name "ledback" -- start
pm2 save
pm2 startup   # 再起動時に自動起動
```

### オプションD — VPS上でDocker

```bash
# VPS上で実行
git clone https://github.com/Bikash4JP/ledback.git
cd ledback
docker compose up -d
```

---

## 5. データベース

`ledback` リポジトリの `.env.example` で使用するデータベースエンジンを確認してください。よくある構成：

| エンジン | ホスティングオプション |
|---|---|
| PostgreSQL | Railway Postgres、Supabase、Neon、AWS RDS |
| SQLite | 個人利用は可能；マルチユーザー本番環境には非推奨 |
| MySQL | PlanetScale、Railway MySQL |

---

## 6. Webデプロイ（Expo Web）

Webバージョン（`npx expo export --platform web`）は静的ファイルとして書き出されます。以下のサービスにデプロイできます：

- **Vercel**：`vercel --prod`（Expo Webの静的出力を自動検出）
- **Netlify**：`dist/` フォルダをドラッグ＆ドロップ
- **GitHub Pages**：`dist/` を `gh-pages` ブランチにpush

> Webビルドはシングルページアプリ（SPA）です。ディープリンク（例：`/ledger/123`）を正常に動作させるには、404エラーを `index.html` にリダイレクトするようにホスティング側で設定してください。

---

## 7. 本番リリースチェックリスト

- [ ] `EXPO_PUBLIC_API_URL` が本番バックエンドを指している（HTTPS）
- [ ] バックエンドが永続的なデータベースで動作している（SQLiteファイルは避ける）
- [ ] バックエンドドメインでSSL/TLSが有効
- [ ] `app.json` の `usesCleartextTraffic: true` を本番では削除する（HTTP通信を許可する設定 — 開発時のみ使用）
- [ ] App Store / Play StoreにEAS本番ビルドを提出済み
- [ ] OTAアップデートチャンネルを設定済み

---

## 8. バージョン管理

リリース前に以下の2箇所のバージョンを上げてください：

| ファイル | フィールド |
|---|---|
| `package.json` | `"version"` |
| `app.json` | `expo.version` |

また、`app.json` の `expo.android.versionCode`（整数値）も毎回インクリメントしてください（Play Storeへのアップロードごとに増加が必要です）。

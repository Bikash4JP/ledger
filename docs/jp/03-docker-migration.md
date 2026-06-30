# MobiLedger — 新しいPC・自宅PCへの移行ガイド（Docker）

> このガイドは、**別のマシン**（例：退職後の自宅ノートPC）でMobiLedgerの開発を続けるための手順です。

---

## ステップ0 — 現在のPCを離れる前に

**アクセスを失う前に必ずこれを実行してください：**

```bash
# 現在のPCで ledger リポジトリ内から実行
cd ledger
git add -A
git commit -m "chore: 作業中の変更を保存（マシン移行前）"
git push origin main

# .env ファイルの内容（バックエンドURL等）は安全な場所に別途メモしておくこと
# （.env はgitには絶対コミットしないこと）
```

`ledger` と `ledback` の両リポジトリが完全にGitHubにpushされていることを確認してください。

---

## ステップ1 — 自宅PCに必要なツールをインストール

| ツール | ダウンロード先 |
|---|---|
| Docker Desktop | https://www.docker.com/products/docker-desktop |
| Git | https://git-scm.com |
| Node.js 20 LTS | https://nodejs.org（Dockerのみで開発する場合は任意） |

Docker Desktopインストール後：
- Docker Desktopを開き、Dockerエンジンが起動していることを確認（緑色のステータスアイコン）。
- Windowsの場合：WSL 2統合が有効か確認（Docker Desktop → 設定 → Resources → WSL Integration）。

---

## ステップ2 — 両リポジトリをクローン

```bash
# 自宅PCで任意の場所にワークスペースを作成
mkdir -p ~/mobiledger-workspace && cd ~/mobiledger-workspace

# フロントエンド（ledger）をクローン
git clone https://github.com/Bikash4JP/ledger.git

# バックエンド（ledback）をクローン
git clone https://github.com/Bikash4JP/ledback.git
```

ワークスペースの構成：

```
mobiledger-workspace/
├── ledger/          ← React Native / Expo フロントエンド
└── ledback/         ← Node.js REST APIバックエンド
```

---

## ステップ3 — 環境変数ファイルを設定

### フロントエンド（ledger）

```bash
cd ledger
cp .env.example .env
```

`.env` を編集：

```bash
# Docker Composeでフルスタックを起動する場合、バックエンドコンテナを指す
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> **スマホ実機テストの場合：** Expo GoアプリでのテストにはPCのLAN IPアドレスを使用してください：
> ```bash
> EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
> ```
> IPアドレスは `ipconfig`（Windows）または `ifconfig`（Mac/Linux）で確認できます。

### バックエンド（ledback）

```bash
cd ../ledback
cp .env.example .env
# データベースURL・ポート・シークレット等を入力
```

---

## ステップ4 — DockerでフロントエンドのみをDocker起動

`ledger` リポジトリにはすぐに使える `Dockerfile` と `docker-compose.yml` が含まれています。

### Webプレビュー（最も手軽 — スマホ不要）

```bash
cd ledger
docker compose up
```

ブラウザで **http://localhost:8081** を開くとアプリが表示されます。

ソースコードはボリュームマウントされているため、PC上でファイルを編集すると即座に反映されます（ホットリロード）。

### Expo Goアプリで実機テスト（LAN経由）

```bash
cd ledger
docker compose run --rm --service-ports app \
  npx expo start --host lan
```

**Expo Go** アプリでQRコードをスキャンして実機でテストできます。  
スマホとPCが**同じWi-Fiネットワーク**に接続されている必要があります。

### トンネルモード（ネットワークが異なる場合）

```bash
cd ledger
docker compose run --rm --service-ports app \
  npx expo start --tunnel
```

ngrokを使用するため、スマホとPCが異なるネットワークでも動作します。

---

## ステップ5 — フロントエンド＋バックエンドのフルスタック起動

`ledback` リポジトリに独自の `Dockerfile` がある場合、以下のフルスタック用 docker-compose ファイルを使用できます。

`mobiledger-workspace/docker-compose.full.yml` を作成してください：

```yaml
# MobiLedger フルスタック開発環境
# このファイルを ledger/ と ledback/ の親フォルダに配置
# 起動方法：docker compose -f docker-compose.full.yml up

services:

  backend:
    build:
      context: ./ledback
      dockerfile: Dockerfile
    container_name: mobiledger-backend
    env_file:
      - ./ledback/.env
    ports:
      - "3000:3000"
    networks:
      - mobiledger-net
    restart: unless-stopped

  frontend:
    build:
      context: ./ledger
      dockerfile: Dockerfile
    container_name: mobiledger-frontend
    volumes:
      - ./ledger:/app
      - /app/node_modules
    env_file:
      - ./ledger/.env
    environment:
      - EXPO_PUBLIC_API_URL=http://backend:3000
    ports:
      - "8081:8081"
      - "19000:19000"
      - "19001:19001"
      - "19006:19006"
    depends_on:
      - backend
    networks:
      - mobiledger-net
    stdin_open: true
    tty: true
    restart: unless-stopped

networks:
  mobiledger-net:
    driver: bridge
```

起動：

```bash
cd mobiledger-workspace
docker compose -f docker-compose.full.yml up
```

---

## ステップ6 — 動作確認

| 確認項目 | 期待される結果 |
|---|---|
| http://localhost:8081 | MobiLedger Webアプリが表示される |
| http://localhost:3000/ledgers | バックエンドAPIがJSONを返す |
| アプリからログイン | 認証が通り、データが同期される |
| 取引を追加 | 一覧にすぐ表示される |

---

## トラブルシューティング

### Dockerのビルドが `npm install` で失敗する

```bash
# キャッシュなしで再ビルド
docker compose build --no-cache
docker compose up
```

### ポートが既に使用されている

```bash
# ポート8081を使用しているプロセスを確認
netstat -ano | findstr :8081        # Windows
lsof -i :8081                       # Mac/Linux
```

### コンテナ内でホットリロードが動かない

`docker-compose.yml` のボリュームマウント（`.:/app`）が正しく設定されているか確認してください。ローカルのソースコードがコンテナにマウントされていれば、ファイル保存でMetroが自動リロードします。

### スマホから接続できない（Expo Go）

1. スマホとPCが**同じWi-Fi**に接続されているか確認。
2. PCのファイアウォールでポート19000と8081を一時的に許可。
3. `--tunnel` モードを代替手段として使用。

### アプリが古いデータを表示する / キャッシュが古い

```bash
# コンテナ内またはローカルで実行
npx expo start -c
```

---

## Dockerを使わない場合（Node.js直接実行）

自宅PCでDockerを使わない場合の手順：

```bash
# Node.js 20 LTS をインストール後
cd ledger
npm install
cp .env.example .env
# .env を編集
npx expo start
```

バックエンド：

```bash
cd ledback
npm install
cp .env.example .env
npm run dev
```

---

## 移行チェックリスト

- [ ] 旧PCからGitHubに全コードをpush済み
- [ ] 自宅PCにDocker Desktopをインストール済み
- [ ] 両リポジトリをクローン済み
- [ ] `.env` ファイルを設定済み
- [ ] `docker compose up` がエラーなく起動する
- [ ] ブラウザで http://localhost:8081 が開く
- [ ] バックエンドが起動していればログイン・データ同期が動作する

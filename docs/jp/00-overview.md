# MobiLedger — プロジェクト概要

> **バージョン:** 1.0.0 | **対応プラットフォーム:** iOS / Android / Web | **開発者:** Bikash Thapa

---

## MobiLedgerとは？

**MobiLedger** は、**React Native + Expo** を使用して構築されたプロフェッショナル向けのバイリンガル（英語・日本語）会計・取引管理モバイルアプリです。日々の財務入力（現金出納帳 / 仕訳）を、試算表・損益計算書・貸借対照表・キャッシュフローレポートへリアルタイムに自動変換します。

### 対象ユーザー

- 個人事業主・フリーランサー
- ポータブルなデジタル元帳を必要とする中小企業
- 日本語対応の会計ソフトを使う会計専門家

---

## リポジトリ構成

このプロジェクトは2つのリポジトリに分かれています：

| リポジトリ | 役割 | 言語・技術スタック |
|---|---|---|
| [`ledger`](https://github.com/Bikash4JP/ledger) | モバイル/Webフロントエンド | React Native, Expo, TypeScript |
| [`ledback`](https://github.com/Bikash4JP/ledback) | REST APIバックエンド | Node.js (Express), データベース |

---

## 主な機能一覧

| 機能 | 状態 |
|---|---|
| 現金出納帳・仕訳（複式簿記） | ✅ |
| 試算表 | ✅ |
| 損益計算書（P&L） | ✅ |
| 貸借対照表 | ✅ |
| キャッシュフロー分析 | ✅ |
| 元帳管理（CRUD） | ✅ |
| バイリンガルUI（英語・日本語） | ✅ |
| 12種類の通貨記号 | ✅ |
| PDFエクスポート | ✅ |
| バックエンドによるクラウド同期 | ✅ |
| デモモード（ログイン不要） | ✅ |
| ダーク・ライトテーマ | ✅ |

---

## ドキュメント一覧

| ドキュメント | 内容 |
|---|---|
| [01-architecture.md](01-architecture.md) | システム設計・コンポーネント図・データフロー |
| [02-development.md](02-development.md) | ローカル開発環境構築（Docker あり・なし） |
| [03-docker-migration.md](03-docker-migration.md) | **新しいPC・自宅PCから開発を続ける方法** |
| [04-api-reference.md](04-api-reference.md) | REST APIリファレンス |
| [05-deployment.md](05-deployment.md) | EASモバイルビルドとバックエンドのデプロイ |

---

## クイックスタート（最小構成）

```bash
# フロントエンドをクローン
git clone https://github.com/Bikash4JP/ledger.git
cd ledger
npm install

# デモモードで起動（バックエンド不要）
npx expo start -c
```

ログインしていない場合、アプリは自動的に**デモモード**で起動します。56件の組み込み元帳とサンプル取引があらかじめ用意されており、バックエンドや `.env` ファイルなしでUIを確認できます。

---

*開発者：**Bikash Thapa** — プレリリース版*

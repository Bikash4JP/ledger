# MobiLedger — APIリファレンス

フロントエンド（`src/storage/apiClient.ts`）から送信される全APIリクエストは、バックエンド（`ledback`）を対象としています。

---

## ベースURL

```
EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL
```

例：`http://localhost:3000`

全リクエストは `{EXPO_PUBLIC_API_URL}{パス}` に送信されます。

---

## 認証ヘッダー

認証済みリクエストにはすべて以下を含みます：

```http
x-user-email: user@example.com
Content-Type: application/json
```

メールアドレスはログイン時に設定される `userIdentity.ts` シングルトンから取得されます。

> `x-user-email` ヘッダーのないリクエストは未認証とみなされ、401エラーになります。

---

## 認証エンドポイント

### POST `/auth/signup`

新しいユーザーアカウントを作成します。

**リクエストボディ：**
```json
{
  "name": "Bikash Thapa",
  "businessName": "Biku Dev",
  "email": "bikash@example.com",
  "username": "bikash",
  "password": "securePassword123"
}
```

| フィールド | 型 | 必須 | 備考 |
|---|---|---|---|
| `name` | string | 必須 | 表示名 |
| `businessName` | string | 任意 | 会社・屋号名 |
| `email` | string | 必須 | 全APIリクエストのユーザー識別に使用 |
| `username` | string | 必須 | ユニークなハンドル名 |
| `password` | string | 必須 | 最低文字数はバックエンドの設定による |

**成功レスポンス（200）：**
```json
{
  "id": "uuid",
  "username": "bikash",
  "email": "bikash@example.com",
  "fullName": "Bikash Thapa",
  "businessName": "Biku Dev",
  "phone": null,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

### POST `/auth/login`

ユーザー名またはメールアドレスで認証します。

**リクエストボディ：**
```json
{
  "usernameOrEmail": "bikash",
  "password": "securePassword123"
}
```

**成功レスポンス（200）：** サインアップと同じ `AuthUser` オブジェクト。

---

## 元帳エンドポイント

### GET `/ledgers`

認証ユーザーの全元帳を取得します。

**ヘッダー：** `x-user-email` 必須。

**レスポンス（200）：**
```json
[
  {
    "id": "uuid-1",
    "name": "Cash in Hand",
    "groupName": "Current Asset",
    "nature": "Asset",
    "isParty": false,
    "isGroup": false,
    "categoryLedgerId": null
  }
]
```

---

### POST `/ledgers`

新しい元帳を作成します。

**ヘッダー：** `x-user-email` 必須。

**リクエストボディ：**
```json
{
  "name": "消耗品費",
  "groupName": "Indirect Expense",
  "nature": "Expense",
  "isParty": false,
  "isGroup": false,
  "categoryLedgerId": null
}
```

| フィールド | 型 | 必須 | 備考 |
|---|---|---|---|
| `name` | string | 必須 | 勘定科目名 |
| `groupName` | string | 必須 | カテゴリーグループ |
| `nature` | string | 必須 | `Asset`、`Liability`、`Income`、`Expense` のいずれか |
| `isParty` | boolean | 任意 | 取引先元帳の場合は true |
| `isGroup` | boolean | 任意 | 親グループ元帳の場合は true |
| `categoryLedgerId` | string \| null | 任意 | 補助勘定のための親元帳ID |

**レスポンス（201）：** 作成された元帳オブジェクト。

---

### PUT `/ledgers/:id`

既存の元帳を更新します。

**ヘッダー：** `x-user-email` 必須。

**レスポンス（200）：** 更新された元帳オブジェクト。

---

### DELETE `/ledgers/:id`

元帳を削除します。取引が紐付いている場合は失敗します。

**レスポンス（200）：** `{ "success": true }` またはエラーメッセージ。

---

### GET `/ledgers/:id/statement`

特定の元帳の取引明細をフィルタリングして取得します。

**クエリパラメーター：**

| パラメーター | 型 | 説明 |
|---|---|---|
| `from` | string（YYYY-MM-DD） | 開始日（以降） |
| `to` | string（YYYY-MM-DD） | 終了日（以前） |

**例：**
```
GET /ledgers/uuid-1/statement?from=2024-04-01&to=2025-03-31
```

**レスポンス（200）：**
```json
[
  {
    "date": "2024-04-15",
    "voucherType": "Receipt",
    "narration": "売上代金",
    "debit": 50000,
    "credit": 0,
    "balance": 50000
  }
]
```

---

## 仕訳エンドポイント

### GET `/entries`

認証ユーザーの全仕訳を取得します。

**レスポンス（200）：**
```json
[
  {
    "id": "entry-uuid",
    "date": "2024-04-15",
    "voucherType": "Receipt",
    "narration": "売上代金",
    "lines": [
      {
        "debitLedgerId": "uuid-cash",
        "creditLedgerId": "uuid-sales",
        "amount": 50000
      }
    ]
  }
]
```

---

### POST `/entries`

新しい仕訳を作成します（1件以上の行）。

**リクエストボディ：**
```json
{
  "date": "2024-04-15",
  "voucherType": "Receipt",
  "narration": "売上代金",
  "lines": [
    {
      "debitLedgerId": "uuid-cash",
      "creditLedgerId": "uuid-sales",
      "amount": 50000,
      "narration": "現金売上"
    }
  ]
}
```

| フィールド | 型 | 備考 |
|---|---|---|
| `date` | string | `YYYY-MM-DD` 形式 |
| `voucherType` | string | 下記の伝票タイプ参照 |
| `narration` | string | 摘要（任意） |
| `lines` | 配列 | 借方・貸方のペア（1件以上） |

---

### DELETE `/entries/:id`

IDで仕訳を削除します。

---

## 取引エンドポイント

### GET `/transactions`

全仕訳の個別取引行を取得します。

**レスポンス（200）：**
```json
[
  {
    "id": "txn-uuid",
    "voucherType": "Receipt",
    "date": "2024-04-15",
    "debitLedgerId": "uuid-cash",
    "creditLedgerId": "uuid-sales",
    "amount": 50000,
    "narration": "現金売上"
  }
]
```

このエンドポイントは、クライアントが試算表・損益計算書・貸借対照表の計算に使用するフラットな取引データを返します。

---

## エラーレスポンス

| HTTPステータス | 意味 |
|---|---|
| `400` | 不正なリクエスト — 必須フィールドの欠落・無効な値 |
| `401` | 未認証 — `x-user-email` ヘッダーが不正または欠落 |
| `404` | リソースが見つからない |
| `409` | 競合 — 例：取引が紐付いた元帳を削除しようとした |
| `500` | サーバーエラー |

エラーレスポンスのボディ：
```json
{
  "error": "エラーの説明"
}
```

---

## 伝票タイプ一覧

| タイプ | 日本語 | 用途 |
|---|---|---|
| `Receipt` | 入金伝票 | 現金・小切手の受取 |
| `Payment` | 出金伝票 | 現金・小切手の支払 |
| `Journal` | 振替伝票 | 非現金取引の調整 |
| `Contra` | 振替 | 銀行 ↔ 現金の振替 |
| `Sales` | 売上伝票 | 売掛金を発生させる売上 |
| `Purchase` | 仕入伝票 | 買掛金を発生させる仕入 |

---

## 元帳性質一覧

| 性質 | 日本語 | レポート上の配置 |
|---|---|---|
| `Asset` | 資産 | 貸借対照表（左・借方） |
| `Liability` | 負債 | 貸借対照表（右・貸方） |
| `Income` | 収益 | 損益計算書（貸方） |
| `Expense` | 費用 | 損益計算書（借方） |

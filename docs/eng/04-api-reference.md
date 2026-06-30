# MobiLedger — API Reference

All API calls originate from the frontend (`src/storage/apiClient.ts`) and target the backend (`ledback`).

---

## Base URL

```
EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL
```

Example: `http://localhost:3000`

All requests are sent to `{EXPO_PUBLIC_API_URL}{path}`.

---

## Authentication Header

Every authenticated request includes:

```http
x-user-email: user@example.com
Content-Type: application/json
```

The email comes from the `userIdentity.ts` singleton, which is populated on login.

> Requests without the `x-user-email` header are treated as unauthenticated and will only return public/demo data (if the backend supports that) or a 401 error.

---

## Auth Endpoints

### POST `/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "name": "Bikash Thapa",
  "businessName": "Biku Dev",
  "email": "bikash@example.com",
  "username": "bikash",
  "password": "securePassword123"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Full display name |
| `businessName` | string | No | Company/business name |
| `email` | string | Yes | Used as user identity for all API calls |
| `username` | string | Yes | Unique handle |
| `password` | string | Yes | Min length defined by backend |

**Success Response (200):**
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

Authenticate with username or email.

**Request Body:**
```json
{
  "usernameOrEmail": "bikash",
  "password": "securePassword123"
}
```

**Success Response (200):** Same `AuthUser` object as signup.

---

## Ledger Endpoints

### GET `/ledgers`

Fetch all ledger accounts for the authenticated user.

**Headers:** `x-user-email` required.

**Response (200):**
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

Create a new ledger account.

**Headers:** `x-user-email` required.

**Request Body:**
```json
{
  "name": "Office Supplies",
  "groupName": "Indirect Expense",
  "nature": "Expense",
  "isParty": false,
  "isGroup": false,
  "categoryLedgerId": null
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Account name |
| `groupName` | string | Yes | Category group |
| `nature` | string | Yes | `Asset`, `Liability`, `Income`, or `Expense` |
| `isParty` | boolean | No | True if this is a customer/supplier ledger |
| `isGroup` | boolean | No | True if this ledger acts as a parent group |
| `categoryLedgerId` | string \| null | No | Parent ledger ID for sub-accounts |

**Response (201):** Created ledger object.

---

### PUT `/ledgers/:id`

Update an existing ledger.

**Headers:** `x-user-email` required.

**Request Body:** Same fields as POST (partial updates may be supported).

**Response (200):** Updated ledger object.

---

### DELETE `/ledgers/:id`

Delete a ledger. Fails if the ledger has associated transactions.

**Headers:** `x-user-email` required.

**Response (200):** `{ "success": true }` or error message.

---

### GET `/ledgers/:id/statement`

Fetch a filtered transaction statement for a specific ledger.

**Headers:** `x-user-email` required.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `from` | string (YYYY-MM-DD) | Start date filter (inclusive) |
| `to` | string (YYYY-MM-DD) | End date filter (inclusive) |

**Example:**
```
GET /ledgers/uuid-1/statement?from=2024-04-01&to=2025-03-31
```

**Response (200):**
```json
[
  {
    "date": "2024-04-15",
    "voucherType": "Receipt",
    "narration": "Sales proceeds",
    "debit": 50000,
    "credit": 0,
    "balance": 50000
  }
]
```

---

## Entry Endpoints

### GET `/entries`

Fetch all journal/cash book entries for the authenticated user.

**Response (200):**
```json
[
  {
    "id": "entry-uuid",
    "date": "2024-04-15",
    "voucherType": "Receipt",
    "narration": "Sales proceeds",
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

### GET `/entries/:id`

Fetch a single entry by ID.

---

### POST `/entries`

Create a new journal entry (one or more lines).

**Request Body:**
```json
{
  "date": "2024-04-15",
  "voucherType": "Receipt",
  "narration": "Sales proceeds",
  "lines": [
    {
      "debitLedgerId": "uuid-cash",
      "creditLedgerId": "uuid-sales",
      "amount": 50000,
      "narration": "Cash sale"
    }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `date` | string | `YYYY-MM-DD` format |
| `voucherType` | string | `Receipt`, `Payment`, `Journal`, `Contra`, `Sales`, `Purchase` |
| `narration` | string | Optional description |
| `lines` | array | One or more debit/credit line pairs |

---

### DELETE `/entries/:id`

Delete an entry by ID.

---

## Transaction Endpoints

### GET `/transactions`

Fetch all individual transaction lines across all entries.

**Response (200):**
```json
[
  {
    "id": "txn-uuid",
    "voucherType": "Receipt",
    "date": "2024-04-15",
    "debitLedgerId": "uuid-cash",
    "creditLedgerId": "uuid-sales",
    "amount": 50000,
    "narration": "Cash sale"
  }
]
```

This endpoint returns the flat transaction rows that the client uses for all report calculations (Trial Balance, P&L, Balance Sheet).

---

## Error Responses

| HTTP Status | Meaning |
|---|---|
| `400` | Bad request — missing or invalid fields |
| `401` | Unauthorized — missing or invalid `x-user-email` header |
| `404` | Resource not found |
| `409` | Conflict — e.g. deleting a ledger that has transactions |
| `500` | Server error |

Error response body:
```json
{
  "error": "Description of what went wrong"
}
```

---

## Voucher Types Reference

| Type | Japanese | Use Case |
|---|---|---|
| `Receipt` | 入金伝票 | Cash / cheque received |
| `Payment` | 出金伝票 | Cash / cheque paid |
| `Journal` | 振替伝票 | Non-cash adjustments |
| `Contra` | 振替 | Bank ↔ Cash transfers |
| `Sales` | 売上伝票 | Sales creating debtors |
| `Purchase` | 仕入伝票 | Purchases creating creditors |

---

## Ledger Nature Reference

| Nature | Japanese | Report Section |
|---|---|---|
| `Asset` | 資産 | Balance Sheet (left) |
| `Liability` | 負債 | Balance Sheet (right) |
| `Income` | 収益 | Profit & Loss (credit side) |
| `Expense` | 費用 | Profit & Loss (debit side) |

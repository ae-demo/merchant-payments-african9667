# Domain Model

The core entities behind merchant onboarding, payment collection, and payouts.

```mermaid
erDiagram
    MERCHANT ||--o{ BANK_ACCOUNT : has
    MERCHANT ||--o{ PAYMENT_LINK : creates
    MERCHANT ||--o{ PAYOUT : receives
    PAYMENT_LINK ||--o{ TRANSACTION : "paid via"
    TRANSACTION ||--o| DISPUTE : "may raise"

    MERCHANT {
      string id
      string businessName
      string registrationNumber
      string country
      string currency
      string status
      datetime createdAt
    }
    BANK_ACCOUNT {
      string id
      string merchantId
      string accountName
      string accountNumber
      string bankName
    }
    PAYMENT_LINK {
      string id
      string merchantId
      decimal amount
      string currency
      string description
      string status
      datetime createdAt
      datetime expiresAt
    }
    TRANSACTION {
      string id
      string paymentLinkId
      string merchantId
      string method
      decimal amount
      string currency
      string status
      string providerReference
      datetime createdAt
    }
    PAYOUT {
      string id
      string merchantId
      decimal amount
      string currency
      string type
      string status
      datetime scheduledAt
      datetime completedAt
    }
    DISPUTE {
      string id
      string transactionId
      string reason
      decimal amount
      string status
      datetime createdAt
      datetime resolvedAt
    }
```

- A `MERCHANT` starts `pending` review and moves to `approved`, `rejected` or `suspended`.
- A `PAYMENT_LINK` is `open`, `paid` or `expired`; a `TRANSACTION` records one payment attempt against it (`mobile_money` or `card`), moving through `pending`, `completed`, `failed`, or `disputed`.
- A `PAYOUT` is either `automatic` (daily schedule) or `manual` (on-demand request), moving through `pending`, `completed`, `failed`.
- A `DISPUTE` tracks a chargeback raised against a `TRANSACTION`, debiting the merchant's balance immediately and reversing it if resolved in the merchant's favor.


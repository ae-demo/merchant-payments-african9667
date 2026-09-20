# Validation report

- **Issue:** #9
- **Commit:** 0a5c99edad5c6cdf19d84c205883a9524278cb77
- **Generated:** 2026-09-20T08:27:15.690Z
- **Playwright:** 1.61.1

## Summary

| Method | Total | Pass | Fail | Not run |
|---|---|---|---|---|
| e2e | 30 | 2 | 28 | 0 |
| manual (human checklist) | 1 | — | — | — |
| scenario (not validated) | 0 | — | — | — |

## E2E results

| Criterion | Must | Status | Spec | Notes |
|---|---|---|---|---|
| AC-001-a | A new user can create a merchant account | ❌ fail | `tests/e2e/specs/AC-001-a.spec.ts` | — |
| AC-002-a | A merchant can sign in via single sign-on and reach their account | ✅ pass | `tests/e2e/specs/AC-002-a.spec.ts` | — |
| AC-002-b | A Platform Admin can sign in via single sign-on and reach the admin console | ✅ pass | `tests/e2e/specs/AC-002-b.spec.ts` | — |
| AC-003-a | A merchant can submit business details and a bank account | ❌ fail | `tests/e2e/specs/AC-003-a.spec.ts` | — |
| AC-003-b | A merchant cannot accept live payments until their submission is approved | ❌ fail | `tests/e2e/specs/AC-003-b.spec.ts` | — |
| AC-004-a | A merchant can create a payment link specifying an amount and a description | ❌ fail | `tests/e2e/specs/AC-004-a.spec.ts` | — |
| AC-005-a | A created payment link is available as a shareable link a customer can open | ❌ fail | `tests/e2e/specs/AC-005-a.spec.ts` | — |
| AC-006-a | A merchant can view a list of their payment links and each one's status | ❌ fail | `tests/e2e/specs/AC-006-a.spec.ts` | — |
| AC-006-b | A merchant can view a history of their transactions | ❌ fail | `tests/e2e/specs/AC-006-b.spec.ts` | — |
| AC-007-a | A merchant can view their current available balance | ❌ fail | `tests/e2e/specs/AC-007-a.spec.ts` | — |
| AC-008-a | A merchant receives a notification when a customer's payment completes | ❌ fail | `tests/e2e/specs/AC-008-a.spec.ts` | healed ×1 |
| AC-009-a | A merchant can request a payout of their available balance | ❌ fail | `tests/e2e/specs/AC-009-a.spec.ts` | — |
| AC-009-b | A requested payout appears in the merchant's payout history with a status | ❌ fail | `tests/e2e/specs/AC-009-b.spec.ts` | — |
| AC-011-a | Opening a payment link shows the amount owed and the merchant's name | ❌ fail | `tests/e2e/specs/AC-011-a.spec.ts` | — |
| AC-012-a | A customer can complete payment of a payment link using mobile money | ❌ fail | `tests/e2e/specs/AC-012-a.spec.ts` | — |
| AC-013-a | A customer can complete payment of a payment link using a card | ❌ fail | `tests/e2e/specs/AC-013-a.spec.ts` | — |
| AC-014-a | A customer receives a receipt after a successful payment | ❌ fail | `tests/e2e/specs/AC-014-a.spec.ts` | — |
| AC-015-a | A Platform Admin can view a list of pending merchant onboarding submissions | ❌ fail | `tests/e2e/specs/AC-015-a.spec.ts` | — |
| AC-015-b | A Platform Admin can approve a pending merchant submission | ❌ fail | `tests/e2e/specs/AC-015-b.spec.ts` | — |
| AC-015-c | A Platform Admin can reject a pending merchant submission | ❌ fail | `tests/e2e/specs/AC-015-c.spec.ts` | — |
| AC-016-a | A Platform Admin can view transactions belonging to any merchant, not just one | ❌ fail | `tests/e2e/specs/AC-016-a.spec.ts` | — |
| AC-017-a | A Platform Admin can view a list of disputed transactions | ❌ fail | `tests/e2e/specs/AC-017-a.spec.ts` | — |
| AC-017-b | A Platform Admin can resolve a dispute in favor of the merchant | ❌ fail | `tests/e2e/specs/AC-017-b.spec.ts` | — |
| AC-017-c | A Platform Admin can resolve a dispute in favor of the customer | ❌ fail | `tests/e2e/specs/AC-017-c.spec.ts` | — |
| AC-018-a | A Platform Admin can suspend an approved merchant's account | ❌ fail | `tests/e2e/specs/AC-018-a.spec.ts` | — |
| AC-018-b | A Platform Admin can reactivate a suspended merchant's account | ❌ fail | `tests/e2e/specs/AC-018-b.spec.ts` | — |
| AC-019-a | A customer can complete a payment without signing in or creating an account | ❌ fail | `tests/e2e/specs/AC-019-a.spec.ts` | — |
| AC-020-a | A merchant can register under Nigeria, Kenya, or Ghana with the matching currency | ❌ fail | `tests/e2e/specs/AC-020-a.spec.ts` | — |
| AC-021-a | Raising a dispute on a transaction reduces the merchant's available balance by the disputed amount | ❌ fail | `tests/e2e/specs/AC-021-a.spec.ts` | — |
| AC-021-b | Resolving a dispute in the merchant's favor reverses the earlier debit | ❌ fail | `tests/e2e/specs/AC-021-b.spec.ts` | — |

## Failures

### AC-001-a — A new user can create a merchant account

Spec: `tests/e2e/specs/AC-001-a.spec.ts`
Location: `AC-001-a.spec.ts:6`

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Approved|Pending|Rejected|Suspended/)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/Approved|Pending|Rejected|Suspended/)

```

### AC-003-a — A merchant can submit business details and a bank account

Spec: `tests/e2e/specs/AC-003-a.spec.ts`
Location: `AC-003-a.spec.ts:7`

```
Error: upstream request timeout

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 504
```

### AC-003-b — A merchant cannot accept live payments until their submission is approved

Spec: `tests/e2e/specs/AC-003-b.spec.ts`
Location: `AC-003-b.spec.ts:7`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-004-a — A merchant can create a payment link specifying an amount and a description

Spec: `tests/e2e/specs/AC-004-a.spec.ts`
Location: `AC-004-a.spec.ts:7`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-005-a — A created payment link is available as a shareable link a customer can open

Spec: `tests/e2e/specs/AC-005-a.spec.ts`
Location: `AC-005-a.spec.ts:7`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-006-a — A merchant can view a list of their payment links and each one's status

Spec: `tests/e2e/specs/AC-006-a.spec.ts`
Location: `AC-006-a.spec.ts:7`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-006-b — A merchant can view a history of their transactions

Spec: `tests/e2e/specs/AC-006-b.spec.ts`
Location: `AC-006-b.spec.ts:7`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-007-a — A merchant can view their current available balance

Spec: `tests/e2e/specs/AC-007-a.spec.ts`
Location: `AC-007-a.spec.ts:7`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-008-a — A merchant receives a notification when a customer's payment completes

Spec: `tests/e2e/specs/AC-008-a.spec.ts`
Location: `AC-008-a.spec.ts:20`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-009-a — A merchant can request a payout of their available balance

Spec: `tests/e2e/specs/AC-009-a.spec.ts`
Location: `AC-009-a.spec.ts:14`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-009-b — A requested payout appears in the merchant's payout history with a status

Spec: `tests/e2e/specs/AC-009-b.spec.ts`
Location: `AC-009-b.spec.ts:14`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-011-a — Opening a payment link shows the amount owed and the merchant's name

Spec: `tests/e2e/specs/AC-011-a.spec.ts`
Location: `AC-011-a.spec.ts:7`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-012-a — A customer can complete payment of a payment link using mobile money

Spec: `tests/e2e/specs/AC-012-a.spec.ts`
Location: `AC-012-a.spec.ts:7`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-013-a — A customer can complete payment of a payment link using a card

Spec: `tests/e2e/specs/AC-013-a.spec.ts`
Location: `AC-013-a.spec.ts:7`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-014-a — A customer receives a receipt after a successful payment

Spec: `tests/e2e/specs/AC-014-a.spec.ts`
Location: `AC-014-a.spec.ts:7`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-015-a — A Platform Admin can view a list of pending merchant onboarding submissions

Spec: `tests/e2e/specs/AC-015-a.spec.ts`
Location: `AC-015-a.spec.ts:7`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-015-b — A Platform Admin can approve a pending merchant submission

Spec: `tests/e2e/specs/AC-015-b.spec.ts`
Location: `AC-015-b.spec.ts:7`

```
Test timeout of 30000ms exceeded.
```

### AC-015-c — A Platform Admin can reject a pending merchant submission

Spec: `tests/e2e/specs/AC-015-c.spec.ts`
Location: `AC-015-c.spec.ts:13`

```
Test timeout of 30000ms exceeded.
```

### AC-016-a — A Platform Admin can view transactions belonging to any merchant, not just one

Spec: `tests/e2e/specs/AC-016-a.spec.ts`
Location: `AC-016-a.spec.ts:15`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-017-a — A Platform Admin can view a list of disputed transactions

Spec: `tests/e2e/specs/AC-017-a.spec.ts`
Location: `AC-017-a.spec.ts:13`

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('row').nth(1)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('row').nth(1)

```

### AC-017-b — A Platform Admin can resolve a dispute in favor of the merchant

Spec: `tests/e2e/specs/AC-017-b.spec.ts`
Location: `AC-017-b.spec.ts:12`

```
Error: upstream request timeout

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 504
```

### AC-017-c — A Platform Admin can resolve a dispute in favor of the customer

Spec: `tests/e2e/specs/AC-017-c.spec.ts`
Location: `AC-017-c.spec.ts:11`

```
Error: upstream request timeout

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 504
```

### AC-018-a — A Platform Admin can suspend an approved merchant's account

Spec: `tests/e2e/specs/AC-018-a.spec.ts`
Location: `AC-018-a.spec.ts:7`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-018-b — A Platform Admin can reactivate a suspended merchant's account

Spec: `tests/e2e/specs/AC-018-b.spec.ts`
Location: `AC-018-b.spec.ts:7`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-019-a — A customer can complete a payment without signing in or creating an account

Spec: `tests/e2e/specs/AC-019-a.spec.ts`
Location: `AC-019-a.spec.ts:7`

```
Error: GET /me/merchant returned 504 (expected 200 or 404): upstream request timeout
```

### AC-020-a — A merchant can register under Nigeria, Kenya, or Ghana with the matching currency

Spec: `tests/e2e/specs/AC-020-a.spec.ts`
Location: `AC-020-a.spec.ts:15`

```
Error: upstream request timeout

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 504
```

### AC-021-a — Raising a dispute on a transaction reduces the merchant's available balance by the disputed amount

Spec: `tests/e2e/specs/AC-021-a.spec.ts`
Location: `AC-021-a.spec.ts:14`

```
Error: upstream request timeout

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 504
```

### AC-021-b — Resolving a dispute in the merchant's favor reverses the earlier debit

Spec: `tests/e2e/specs/AC-021-b.spec.ts`
Location: `AC-021-b.spec.ts:10`

```
Error: upstream request timeout

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 504
```

## Manual checklist

- [ ] **AC-010-a** — The system runs an automatic payout on a daily schedule without a merchant request

## Healing log

| Criterion | Classification | Change | Commit |
|---|---|---|---|
| AC-008-a | timing | uiSignIn's initial getByRole('textbox', { name: 'Username' }) wait: 10s (default) -> 30s — the deployment's own backend load (many 500s/504s from DEFECT-1) stretches the 'Checking your session...' splash past the default expect timeout on some runs. | `596637d9` |


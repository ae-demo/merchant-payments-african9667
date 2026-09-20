# Validation test plan — merchant-payments-african9667 v1

Source of truth for criteria: `specs/validation/validation-criteria.json`.
Targets: `tests/e2e/targets.json` (merchant-webapp, admin-webapp,
checkout-webapp, payments-api). Test users: `test-merchant` (role Merchant)
and `test-platformadmin` (role PlatformAdmin), from this milestone's roles
gate ticket (#3).

## Root-cause findings that shape this plan

Live exploration (playwright-cli against the deployed environment) and a
read of `payments-api`'s source turned up a defect that dominates this
suite, so it is recorded once here instead of once per criterion:

- **DEFECT-1 (blocking, confirmed live).** `payments-api`'s SQL row-mapping
  for the `merchants` table does not match the database's snake_case
  columns to `MerchantRow`'s camelCase fields (no `@sql:Column`
  annotations — see `payments-api/merchant_store.bal` and
  `payments-api/dispute_store.bal`'s comment). The moment a `merchants` row
  exists for a caller, every operation that reads it back throws
  `sql:FieldMismatchError` and the request 500s:
  - `POST /me/merchant` — the INSERT itself commits (confirmed: a second
    sign-in as the same user lands on `/dashboard`, not `/onboarding`), but
    the handler's own read-back after insert crashes, so the **client always
    sees a failure** even though a row was created.
  - `GET /me/merchant` — 500 for any caller who has a profile (verified
    live: `test-merchant` now gets 500, not 200, after the row above was
    created).
  - `GET /merchants`, `GET /merchants/{id}` — 500 (verified live: admin
    console's merchant list request returns 500).
  - `POST /me/payment-links` — checks `merchant.status` via the same lookup,
    so it 500s too once a profile exists.
  - Transitively: onboarding review/suspend, payment links, transactions,
    payouts, and everything gated on "an approved merchant exists" cannot be
    exercised in this deployment.
  - Observed live as either a fast `500` or a `504 upstream request timeout`
    on the same endpoints across repeated runs — consistent with the same
    crash under load (the gateway's upstream timing out while payments-api
    is busy throwing/logging the mapping error) rather than two separate
    defects.
  - **DEFECT-1b (secondary, UI).** Both admin-webapp and merchant-webapp
    swallow a failed list fetch into an empty array (`data?.data ?? []`)
    rather than surfacing an error, so the admin console shows "No pending
    merchants" / "No merchants" for what is actually a 500 — masking
    DEFECT-1 from a human operator.
- **DEFECT-2 (confirmed by source comment).** No operation in
  `payments-api`'s contract ever calls `raiseDispute` — `dispute_store.bal`'s
  own header comment says so. No actor (merchant, customer, admin) has any
  path to create a dispute, so `disputes` is permanently empty and dispute
  resolution can never be exercised.
- **DEFECT-3 (confirmed by source).** `PaymentLinkDetail.tsx` composes a
  fabricated share URL (`https://pay.example.com/l/{id}`); checkout-webapp's
  real route is `{checkout-webapp origin}/{id}`. The link a merchant is
  shown cannot actually be opened by a customer.
- Documented, non-blocking gaps flagged by the code's own comments (not
  independently re-verified, since DEFECT-1 already blocks the states that
  would exercise them): no balance/summary endpoint (`lib/balance.ts`
  derives it client-side); `CardPay` fabricates a `cardToken` in lieu of a
  tokenization endpoint; `internal-payments-api`'s `bankCode` is filled from
  our `bankName` (`payment_processing.bal`).

Because of DEFECT-1, every criterion whose flow requires an existing (or
approved) merchant profile is expected to fail at that shared setup step.
Each such spec still performs the real flow (via `lib/fixtures.ts`), so it
becomes a genuine regression test the moment the defect is fixed, and it
fails with a message that traces back to DEFECT-1 rather than a vague
timeout.

**Environment constraint, independent of DEFECT-1:** only one Merchant-role
test identity (`test-merchant`) is provisioned (this milestone's roles gate
ticket, #3) — merchant-webapp has no self-registration, so there is no way
for this suite to create a second one. `owner_user_id` is also UNIQUE per
merchant profile, so `test-merchant` can hold exactly one profile for the
life of this environment. This means: AC-015-c (reject) and AC-018-a/b
(suspend/reactivate) exercise the same shared profile AC-001-a/015-b do
rather than independent fixtures, and AC-016-a ("any merchant, not just
one") can only be fully demonstrated with a second merchant identity that
does not exist in this environment — its spec verifies the admin
all-transactions view surfaces `test-merchant`'s own transaction and notes
the multi-merchant gap rather than fabricating a second identity.

## AC-001-a — A new user can create a merchant account

- Target: merchant-webapp (UI)
- Steps: sign in as `test-merchant`; if no profile yet, fill and submit the
  onboarding form (business + bank details); if a profile already exists,
  treat reaching it as this criterion already satisfied.
- Assert: no error alert after submit, and the app navigates to `/dashboard`.
- Expected: **fails** — DEFECT-1. The submit shows "Could not submit your
  profile for review." (confirmed live: 500 with
  `incompatible types: 'sql:FieldMismatchError' cannot be cast to
  '(anydata|sql:Error)'`).
- Source of truth: live (playwright-cli), `merchant-webapp/src/pages/Onboarding.tsx`.

## AC-002-a — A merchant can sign in via SSO and reach their account

- Target: merchant-webapp (UI)
- Steps: sign in as `test-merchant`.
- Assert: the app leaves the IdP host and renders its own authenticated
  shell (the "Account" button in the top bar is visible) — "reaching their
  account" is read as reaching the signed-in merchant portal, independent of
  onboarding status, since a brand-new merchant's only reachable screen is
  `/onboarding`.
- Expected: **passes** — confirmed live.
- Source of truth: live (playwright-cli), `merchant-webapp/src/shell/AppShell.tsx`.

## AC-002-b — A Platform Admin can sign in via SSO and reach the admin console

- Target: admin-webapp (UI)
- Steps: sign in as `test-platformadmin`.
- Assert: the Admin Console shell renders (sidebar with Onboarding/Merchants/
  Transactions/Disputes links visible).
- Expected: **passes** — confirmed live.
- Source of truth: live (playwright-cli), `admin-webapp/src/shell/AppShell.tsx`.

## AC-003-a — A merchant can submit business details and a bank account

- Target: payments-api (API, via merchant-webapp's own call shape)
- Steps: sign in as `test-merchant`; `POST /me/merchant` with business +
  bank fields.
- Assert: `201` with the submitted `bankAccount` echoed back.
- Expected: **fails** — DEFECT-1.
- Source of truth: `specs/design/components/payments-api/openapi.yaml`.

## AC-003-b — A merchant cannot accept live payments until approved

- Target: payments-api (API)
- Steps: with a `pending` merchant profile, attempt `POST /me/payment-links`.
- Assert: `400` ("merchant is not approved to accept payments yet").
- Expected: **fails at setup** — a `pending` profile can't be read back
  (DEFECT-1), so this rule (present and correct in
  `payments-api/openapi_service.bal`) cannot be exercised live.
- Source of truth: `payments-api/openapi_service.bal` (`post me/payment-links`).

## AC-004-a — A merchant can create a payment link with an amount and description

- Target: payments-api (API)
- Steps: ensure an approved merchant; `POST /me/payment-links`.
- Assert: `201` with `amount`/`description` echoed.
- Expected: **fails at setup** — DEFECT-1.

## AC-005-a — A created payment link is available as a shareable link a customer can open

- Target: merchant-webapp (UI) + checkout-webapp (UI)
- Steps: ensure an approved merchant and a payment link; open
  `PaymentLinkDetail`, read the displayed share URL, then navigate to it.
- Assert: the URL opens the checkout-webapp `PaymentDetails` screen for that
  link.
- Expected: **fails** — DEFECT-1 blocks setup, and even given a link,
  DEFECT-3 means the displayed URL (`pay.example.com/l/{id}`) does not
  resolve to checkout-webapp at all.

## AC-006-a — A merchant can view a list of their payment links and each one's status

- Target: merchant-webapp (UI)
- Steps: ensure an approved merchant with a payment link; open `/payment-links`.
- Assert: the link's description and status chip are visible in the table.
- Expected: **fails at setup** — DEFECT-1.

## AC-006-b — A merchant can view a history of their transactions

- Target: merchant-webapp (UI)
- Steps: ensure an approved merchant, a payment link, and a completed
  transaction (pay it via checkout); open `/transactions`.
- Assert: the transaction row is visible.
- Expected: **fails at setup** — DEFECT-1.

## AC-007-a — A merchant can view their current available balance

- Target: merchant-webapp (UI)
- Steps: ensure an approved merchant; open `/dashboard`.
- Assert: the "Available balance" card renders a formatted amount.
- Expected: **fails at setup** — DEFECT-1.

## AC-008-a — A merchant receives a notification when a customer's payment completes

- Target: payments-api (API) — notification delivery is via email/SMS
  services outside this suite's reach, so this checks the API-observable
  side effect (`payments-api/notify.bal` fires on a completed payment).
- Steps: ensure an approved merchant, a payment link, pay it, then re-check
  the transaction status transitions to `completed`.
- Assert: transaction status is `completed` after payment.
- Expected: **fails at setup** — DEFECT-1.

## AC-009-a — A merchant can request a payout of their available balance

- Target: payments-api (API)
- Steps: ensure an approved merchant with a completed transaction (balance >
  0); `POST /me/payouts`.
- Assert: `201` with a `manual` payout.
- Expected: **fails at setup** — DEFECT-1.

## AC-009-b — A requested payout appears in the merchant's payout history with a status

- Target: merchant-webapp (UI)
- Steps: after requesting a payout (AC-009-a's flow), open `/payouts`.
- Assert: the payout row is visible with a status chip.
- Expected: **fails at setup** — DEFECT-1.

## AC-010-a — Automatic daily payout (manual)

- Method: manual. Rendered as an unchecked human checklist item in the report.

## AC-011-a — Opening a payment link shows the amount owed and the merchant's name

- Target: checkout-webapp (UI)
- Steps: ensure an approved merchant with an open payment link; open
  `{checkout-webapp}/{ linkId }`.
- Assert: amount and merchant name are visible.
- Expected: **fails at setup** — DEFECT-1.
- Source of truth: `checkout-webapp/src/pages/PaymentDetailsPage.tsx`.

## AC-012-a — A customer can complete payment via mobile money

- Target: checkout-webapp (UI)
- Steps: from PaymentDetails, choose Mobile Money, enter a number, confirm.
- Assert: PaymentResult shows a successful/processing outcome.
- Expected: **fails at setup** — DEFECT-1.

## AC-013-a — A customer can complete payment via card

- Target: checkout-webapp (UI)
- Steps: from PaymentDetails, choose Card, enter card details, pay.
- Assert: PaymentResult shows a successful/processing outcome.
- Expected: **fails at setup** — DEFECT-1.

## AC-014-a — A customer receives a receipt after a successful payment

- Target: checkout-webapp (UI)
- Steps: complete a payment (mobile money); read the PaymentResult copy.
- Assert: the result screen states a receipt was sent.
- Expected: **fails at setup** — DEFECT-1.

## AC-015-a — A Platform Admin can view a list of pending merchant onboarding submissions

- Target: admin-webapp (UI)
- Steps: ensure a pending merchant exists; sign in as admin; open `/onboarding`.
- Assert: the merchant's business name is listed.
- Expected: **fails at setup** — DEFECT-1 (and DEFECT-1b hides the 500 as a
  false "No pending merchants" empty state).

## AC-015-b — A Platform Admin can approve a pending merchant submission

- Target: admin-webapp (UI)
- Steps: from the onboarding queue, open a pending merchant, click Approve.
- Assert: merchant status becomes `approved` (verified via API).
- Expected: **fails at setup** — DEFECT-1.

## AC-015-c — A Platform Admin can reject a pending merchant submission

- Target: admin-webapp (UI)
- Steps: same as 015-b, click Reject instead.
- Assert: merchant status becomes `rejected`.
- Expected: **fails at setup** — DEFECT-1.

## AC-016-a — A Platform Admin can view transactions belonging to any merchant

- Target: admin-webapp (UI)
- Steps: ensure two different merchants each with a completed transaction;
  open `/transactions`.
- Assert: both merchants' transactions are visible.
- Expected: **fails at setup** — DEFECT-1.

## AC-017-a — A Platform Admin can view a list of disputed transactions

- Target: admin-webapp (UI)
- Steps: open `/disputes`.
- Assert: the queue screen renders (heading + table structure) — whether or
  not any dispute exists, since DEFECT-2 means none ever will in this
  deployment.
- Expected: **fails** — DEFECT-1 (API errors on the joined `/merchants` and
  `/transactions` calls the page also needs) and DEFECT-2 (no dispute can
  ever exist to list).

## AC-017-b — A Platform Admin can resolve a dispute in favor of the merchant

## AC-017-c — A Platform Admin can resolve a dispute in favor of the customer

- Target: admin-webapp (UI) / payments-api (API)
- Steps: attempt to find an open dispute to resolve.
- Assert: a dispute exists and `POST /disputes/{id}/resolve` succeeds with
  the expected outcome.
- Expected: **fails at setup** — DEFECT-2: no dispute can be raised by any
  actor, so there is never one to resolve.

## AC-018-a — A Platform Admin can suspend an approved merchant's account

- Target: admin-webapp (UI)
- Steps: ensure an approved merchant; open its Merchant Account screen;
  click Suspend.
- Assert: status becomes `suspended`.
- Expected: **fails at setup** — DEFECT-1.

## AC-018-b — A Platform Admin can reactivate a suspended merchant's account

- Target: admin-webapp (UI)
- Steps: from a suspended merchant, click Reactivate.
- Assert: status becomes `approved`.
- Expected: **fails at setup** — DEFECT-1.

## AC-019-a — A customer can complete a payment without signing in or creating an account

- Target: checkout-webapp (UI)
- Steps: open a payment link directly (no prior auth) and pay via mobile
  money.
- Assert: no sign-in is required anywhere in the flow, and payment
  completes.
- Expected: **fails at setup** — DEFECT-1 (no link can be created to test
  against), though the checkout screens themselves require no auth by
  design (confirmed via source: no authz gate in checkout-webapp).

## AC-020-a — A merchant can register under NG/KE/GH with the matching currency

- Target: payments-api (API)
- Steps: `POST /me/merchant` with `country: "KE", currency: "KES"` (a fresh
  identity would be needed per country; this run exercises one pairing since
  only one Merchant-role test identity is available).
- Assert: `201` with the country/currency pairing echoed back correctly.
- Expected: **fails** — DEFECT-1 (and `test-merchant`'s one profile is
  already consumed by AC-001-a's attempt with NG/NGN).

## AC-021-a — Raising a dispute reduces the merchant's available balance

## AC-021-b — Resolving a dispute in the merchant's favor reverses the debit

- Target: payments-api (API)
- Steps: attempt to raise a dispute against a completed transaction.
- Assert: balance debited by the dispute amount; reversed on
  `resolved-merchant`.
- Expected: **fails at setup** — DEFECT-2: `payments-api`'s contract exposes
  no operation to raise a dispute at all (confirmed by source comment in
  `payments-api/dispute_store.bal`), so this cannot be exercised by any
  actor in the current deployment.

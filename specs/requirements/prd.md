# Merchant Payments Africa — PRD

## Problem Statement

Small and medium merchants across African countries need a simple way to collect payments from customers who pay via mobile money or card, but today they juggle separate mobile-money wallets, card terminals, and manual reconciliation to know what they've been paid and when they'll see the cash in their bank account. There is no single place for a merchant to request a payment, watch it get paid, and get settled to their bank.

## Solution

A merchant payments platform where a merchant creates a payment link or invoice for an amount owed, sends it to a customer, and the customer pays on a hosted checkout page using mobile money or a card. The platform tracks every transaction, keeps a running merchant balance, and settles collected funds out to the merchant's bank account. Platform staff can oversee merchants and transactions across the system.

## Actors

- **Merchant** — a registered business that creates payment links/invoices, tracks its transactions and balance, links a bank account, and receives payouts.
- **Customer** — the person paying a merchant; pays via a shared payment link using mobile money or card, without needing an account of their own.
- **Platform Admin** — internal staff who review and approve merchant onboarding, monitor transactions across all merchants, resolve disputes, and can suspend or reactivate a merchant.

## User Stories

1. As a Merchant, I want to sign up and create a merchant account, so that I can start accepting payments.
2. As a Merchant, I want to sign in via single sign-on, so that I can securely access my account.
3. As a Merchant, I want to add my business details and bank account, so that I can be verified and receive payouts.
4. As a Merchant, I want to create a payment link/invoice with an amount and description, so that I can request payment from a customer.
5. As a Merchant, I want to share a payment link with a customer, so that they can pay me remotely.
6. As a Merchant, I want to view the status and history of my payment links and transactions, so that I can track my sales.
7. As a Merchant, I want to view my current balance, so that I know how much I have available.
8. As a Merchant, I want to be notified when a payment is completed, so that I know to fulfill the order.
9. As a Merchant, I want to request a payout to my linked bank account, so that I can access my funds on demand.
10. As a Merchant, I want payouts to also happen automatically on a schedule, so that I don't have to remember to request them. *assumed*
11. As a Customer, I want to open a payment link and see the amount and who I'm paying, so that I know what I'm paying for before I commit.
12. As a Customer, I want to pay using mobile money, so that I can pay without a card.
13. As a Customer, I want to pay using a card, so that I can pay if I don't use mobile money.
14. As a Customer, I want to receive a receipt after paying, so that I have proof of payment.
15. As a Platform Admin, I want to sign in via single sign-on, so that I can access the admin console.
16. As a Platform Admin, I want to review merchant onboarding submissions and approve or reject them, so that only legitimate businesses can collect payments.
17. As a Platform Admin, I want to view transactions across all merchants, so that I can monitor platform activity.
18. As a Platform Admin, I want to view and resolve flagged or disputed transactions, so that I can support merchants and customers.
19. As a Platform Admin, I want to suspend or reactivate a merchant account, so that I can enforce compliance.

## Product Decisions

- Merchants and Platform Admins sign in via single sign-on through Thunder, the platform IDP (organization default).
- Customers pay through a hosted checkout page without creating an account. *assumed*
- Payment processing — charging, refunding, and checking the status of mobile money and card payments — uses the organization's registered payments service (internal-payments-api).
- Payment confirmations and receipts are sent by SMS and email using the organization's registered SMS and email services (sms-service, email-service).
- Payouts run automatically on a daily schedule, and a merchant can additionally request an on-demand payout. *assumed*
- Merchant onboarding requires basic business verification (business name, registration number, and bank account details) before the merchant can accept live payments. *assumed*
- The platform supports local African currencies, with each merchant operating in a single home currency. *assumed*

## Out of Scope

- Currency conversion or multi-currency wallets for a single merchant.
- In-person/POS hardware payment terminals — this platform is link/invoice based only.
- Merchant loans, credit, or cash-advance products.
- Tax reporting and filing on the merchant's behalf.

## Open Questions

1. Which African countries and currencies should the platform launch with first?
2. How should card-network chargebacks/disputes be handled financially (who bears the loss while a dispute is investigated)?
3. Should merchant business verification be a manual admin review, an automated check, or both?

## Further Notes

None.


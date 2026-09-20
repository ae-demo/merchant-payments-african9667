// Mock mode's stand-in for payments-api — the operations merchant-webapp
// actually calls. State lives in module scope (react-webapp's
// mock-mode.md): a create shows up in the next list, and any full page
// load (a reload, a typed URL) re-runs this module and resets to the seed
// below. Only in-app navigation carries a change forward.
//
// NO scope check here — mock/authz/gateway.ts is the gateway layer and
// already refused anything the caller's role does not hold; this file only
// owns each path's REACH, exactly as the real service would: /me/... is the
// caller's own rows and nothing else.
//
// Seed values are the wireframes' own example rows
// (wireframes/scripts/seed.mjs specs/design/components/merchant-webapp/wireframes.dsl)
// joined into payments-api's actual schemas. The wireframe's stat-card
// numbers ("Available balance | 128,400 | NGN") are illustrative and do not
// reconcile with its own example transaction rows — payments-api has no
// balance endpoint at all (src/lib/balance.ts), so this mock, like the real
// app, DERIVES the balance from the seeded transactions and payouts rather
// than hardcoding the wireframe's number.

import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/payments-api";

type Merchant = components["schemas"]["Merchant"];
type MerchantInput = components["schemas"]["MerchantInput"];
type PaymentLink = components["schemas"]["PaymentLink"];
type PaymentLinkInput = components["schemas"]["PaymentLinkInput"];
type Transaction = components["schemas"]["Transaction"];
type Payout = components["schemas"]["Payout"];

const MERCHANT_ID = "mock-merchant-1";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// No merchant profile yet — a fresh visitor walks Onboarding first
// (wireframes.dsl flow "Onboard and get approved"). Submitting POST
// /me/merchant approves it instantly here (the mock has no admin-webapp
// review queue to model against), so the walk can continue straight into
// Dashboard, PaymentLinks, Transactions and Payouts with the seeded rows
// below.
let merchant: Merchant | null = null;

let paymentLinks: PaymentLink[] = [
  { id: "pl-204", merchantId: MERCHANT_ID, description: "Order #204", amount: 5000, currency: "NGN", status: "open", createdAt: daysAgo(0) },
  { id: "pl-205", merchantId: MERCHANT_ID, description: "Order #205", amount: 8000, currency: "NGN", status: "open", createdAt: daysAgo(0) },
  { id: "pl-203", merchantId: MERCHANT_ID, description: "Order #203", amount: 12000, currency: "NGN", status: "paid", createdAt: daysAgo(0) },
  { id: "pl-201", merchantId: MERCHANT_ID, description: "Order #201", amount: 3500, currency: "NGN", status: "paid", createdAt: daysAgo(1) },
  { id: "pl-210", merchantId: MERCHANT_ID, description: "Order #210", amount: 150000, currency: "NGN", status: "paid", createdAt: daysAgo(0) },
];

let transactions: Transaction[] = [
  { id: "tx-4", paymentLinkId: "pl-210", merchantId: MERCHANT_ID, method: "card", amount: 150000, currency: "NGN", status: "completed", providerReference: "REF-210", createdAt: daysAgo(0) },
  { id: "tx-2", paymentLinkId: "pl-203", merchantId: MERCHANT_ID, method: "card", amount: 12000, currency: "NGN", status: "completed", providerReference: "REF-203", createdAt: daysAgo(0) },
  { id: "tx-1", paymentLinkId: "pl-204", merchantId: MERCHANT_ID, method: "mobile_money", amount: 5000, currency: "NGN", status: "completed", providerReference: "REF-204", createdAt: daysAgo(0) },
  { id: "tx-3", paymentLinkId: "pl-201", merchantId: MERCHANT_ID, method: "card", amount: 3500, currency: "NGN", status: "disputed", providerReference: "REF-201", createdAt: daysAgo(1) },
];

let payouts: Payout[] = [
  { id: "po-1", merchantId: MERCHANT_ID, amount: 40000, currency: "NGN", type: "automatic", status: "completed", scheduledAt: daysAgo(0), completedAt: daysAgo(0) },
  { id: "po-2", merchantId: MERCHANT_ID, amount: 15000, currency: "NGN", type: "manual", status: "completed", scheduledAt: daysAgo(7), completedAt: daysAgo(7) },
];

function availableBalance(): number {
  const collected = transactions.filter((t) => t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const paidOut = payouts.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const pending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  return Math.max(0, collected - paidOut - pending);
}

function paginate<T>(items: T[], url: URL): { count: number; next: null; previous: null; data: T[] } {
  const limit = Number(url.searchParams.get("limit") ?? 20);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  return { count: items.length, next: null, previous: null, data: items.slice(offset, offset + limit) };
}

let paymentLinkSeq = paymentLinks.length;
let payoutSeq = payouts.length;

export const handlers = [
  http.get("/api/me/merchant", () => {
    if (!merchant) {
      return HttpResponse.json({ code: 404, message: "No profile yet" }, { status: 404 });
    }
    return HttpResponse.json(merchant);
  }),

  http.post("/api/me/merchant", async ({ request }) => {
    const input = (await request.json()) as MerchantInput;
    if (!input?.businessName || !input.registrationNumber || !input.country || !input.currency || !input.bankAccount) {
      return HttpResponse.json({ code: 400, message: "Missing required fields" }, { status: 400 });
    }
    merchant = {
      id: MERCHANT_ID,
      businessName: input.businessName,
      registrationNumber: input.registrationNumber,
      country: input.country,
      currency: input.currency,
      // Instant approval — see the seed comment above.
      status: "approved",
      bankAccount: input.bankAccount,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(merchant, { status: 201 });
  }),

  http.put("/api/me/merchant", async ({ request }) => {
    if (!merchant) return HttpResponse.json({ code: 404, message: "No profile yet" }, { status: 404 });
    const input = (await request.json()) as MerchantInput;
    merchant = { ...merchant, ...input };
    return HttpResponse.json(merchant);
  }),

  http.get("/api/me/payment-links", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const filtered = status ? paymentLinks.filter((l) => l.status === status) : paymentLinks;
    return HttpResponse.json(paginate(filtered, url));
  }),

  http.post("/api/me/payment-links", async ({ request }) => {
    const input = (await request.json()) as PaymentLinkInput;
    if (!input?.description || !input.amount || !input.currency) {
      return HttpResponse.json({ code: 400, message: "Missing required fields" }, { status: 400 });
    }
    paymentLinkSeq += 1;
    const created: PaymentLink = {
      id: `pl-${String(paymentLinkSeq)}`,
      merchantId: MERCHANT_ID,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    paymentLinks = [created, ...paymentLinks];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get("/api/me/transactions", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const filtered = status ? transactions.filter((t) => t.status === status) : transactions;
    return HttpResponse.json(paginate(filtered, url));
  }),

  http.get("/api/me/payouts", ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(paginate(payouts, url));
  }),

  http.post("/api/me/payouts", () => {
    const amount = availableBalance();
    if (amount <= 0) {
      return HttpResponse.json({ code: 400, message: "Insufficient balance" }, { status: 400 });
    }
    payoutSeq += 1;
    const created: Payout = {
      id: `po-${String(payoutSeq)}`,
      merchantId: MERCHANT_ID,
      amount,
      currency: merchant?.currency ?? "NGN",
      type: "manual",
      status: "pending",
      scheduledAt: daysFromNow(1),
      completedAt: null,
    };
    payouts = [created, ...payouts];
    return HttpResponse.json(created, { status: 201 });
  }),
];

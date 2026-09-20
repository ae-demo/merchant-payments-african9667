// The mock SERVICE — payments-api's admin-facing operations, seeded so every
// screen's table, empty state and join are all reachable. State lives in
// module scope: it resets on a full page load (a reload, a typed URL), and
// persists only across in-app navigation — see references/mock-mode.md.
//
// No scope check anywhere here: whether an operation may be called at all is
// mock/authz/gateway.ts's job, read straight from openapi.yaml. What a handler
// owes is its path's reach — every admin operation here reaches every row,
// because none of these paths are under /me/.

import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/payments-api";

type Merchant = components["schemas"]["Merchant"];
type Transaction = components["schemas"]["Transaction"];
type Dispute = components["schemas"]["Dispute"];

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

let merchants: Merchant[] = [
  {
    id: "merchant-1",
    businessName: "Acme Traders",
    registrationNumber: "RC-884213",
    country: "NG",
    currency: "NGN",
    status: "approved",
    bankAccount: { accountName: "Acme Traders Ltd", accountNumber: "0123456789", bankName: "GTBank" },
    createdAt: isoDaysAgo(40),
  },
  {
    id: "merchant-2",
    businessName: "Savanna Goods",
    registrationNumber: "RC-113420",
    country: "GH",
    currency: "GHS",
    status: "suspended",
    bankAccount: { accountName: "Savanna Goods Ltd", accountNumber: "9988776655", bankName: "GCB Bank" },
    createdAt: isoDaysAgo(90),
  },
  {
    id: "merchant-3",
    businessName: "Kilimo Foods",
    registrationNumber: "RC-552091",
    country: "KE",
    currency: "KES",
    status: "approved",
    bankAccount: { accountName: "Kilimo Foods Co", accountNumber: "4455667788", bankName: "Equity Bank" },
    createdAt: isoDaysAgo(30),
  },
  {
    id: "merchant-4",
    businessName: "Zuri Mobile",
    registrationNumber: "RC-771230",
    country: "NG",
    currency: "NGN",
    status: "pending",
    bankAccount: { accountName: "Zuri Mobile Ltd", accountNumber: "0192837465", bankName: "Access Bank" },
    createdAt: isoDaysAgo(0),
  },
  {
    id: "merchant-5",
    businessName: "Baobab Traders",
    registrationNumber: "RC-334455",
    country: "KE",
    currency: "KES",
    status: "pending",
    bankAccount: { accountName: "Baobab Traders", accountNumber: "1122334455", bankName: "KCB Bank" },
    createdAt: isoDaysAgo(1),
  },
  {
    id: "merchant-6",
    businessName: "Sahel Commerce",
    registrationNumber: "RC-990112",
    country: "GH",
    currency: "GHS",
    status: "rejected",
    bankAccount: { accountName: "Sahel Commerce", accountNumber: "5544332211", bankName: "Fidelity Bank" },
    createdAt: isoDaysAgo(10),
  },
];

let transactions: Transaction[] = [
  {
    id: "tx-1",
    paymentLinkId: "link-1",
    merchantId: "merchant-1",
    method: "card",
    amount: 12000,
    currency: "NGN",
    status: "completed",
    providerReference: "PRV-0001",
    createdAt: isoDaysAgo(0),
  },
  {
    id: "tx-2",
    paymentLinkId: "link-2",
    merchantId: "merchant-3",
    method: "mobile_money",
    amount: 2400,
    currency: "KES",
    status: "disputed",
    providerReference: "PRV-0002",
    createdAt: isoDaysAgo(1),
  },
  {
    id: "tx-3",
    paymentLinkId: "link-3",
    merchantId: "merchant-2",
    method: "card",
    amount: 500,
    currency: "GHS",
    status: "failed",
    providerReference: "PRV-0003",
    createdAt: isoDaysAgo(3),
  },
  {
    id: "tx-4",
    paymentLinkId: "link-4",
    merchantId: "merchant-1",
    method: "mobile_money",
    amount: 3000,
    currency: "NGN",
    status: "pending",
    providerReference: "PRV-0004",
    createdAt: isoDaysAgo(0),
  },
  {
    id: "tx-5",
    paymentLinkId: "link-5",
    merchantId: "merchant-3",
    method: "card",
    amount: 1500,
    currency: "KES",
    status: "refunded",
    providerReference: "PRV-0005",
    createdAt: isoDaysAgo(5),
  },
  {
    id: "tx-6",
    paymentLinkId: "link-6",
    merchantId: "merchant-2",
    method: "card",
    amount: 800,
    currency: "GHS",
    status: "disputed",
    providerReference: "PRV-0006",
    createdAt: isoDaysAgo(2),
  },
  {
    id: "tx-7",
    paymentLinkId: "link-7",
    merchantId: "merchant-1",
    method: "card",
    amount: 4000,
    currency: "NGN",
    status: "disputed",
    providerReference: "PRV-0007",
    createdAt: isoDaysAgo(6),
  },
];

let disputes: Dispute[] = [
  {
    id: "dispute-1",
    transactionId: "tx-2",
    reason: "Item not received",
    amount: 2400,
    status: "open",
    createdAt: isoDaysAgo(1),
    resolvedAt: null,
  },
  {
    id: "dispute-2",
    transactionId: "tx-6",
    reason: "Product not as described",
    amount: 800,
    status: "open",
    createdAt: isoDaysAgo(2),
    resolvedAt: null,
  },
  {
    id: "dispute-3",
    transactionId: "tx-7",
    reason: "Duplicate charge",
    amount: 4000,
    status: "resolved-merchant",
    createdAt: isoDaysAgo(6),
    resolvedAt: isoDaysAgo(5),
  },
];

function paginated<T>(items: T[], url: URL): { count: number; next: string | null; previous: string | null; data: T[] } {
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const page = items.slice(offset, offset + limit);
  const next = offset + limit < items.length ? `${url.pathname}?limit=${limit}&offset=${offset + limit}` : null;
  const previous = offset > 0 ? `${url.pathname}?limit=${limit}&offset=${Math.max(0, offset - limit)}` : null;
  return { count: items.length, next, previous, data: page };
}

export const handlers = [
  // Every merchant, optionally filtered by status. merchants:read-all.
  http.get("/api/merchants", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const filtered = status ? merchants.filter((m) => m.status === status) : merchants;
    return HttpResponse.json(paginated(filtered, url));
  }),

  // A single merchant — detail view. 404 when the id does not exist.
  http.get("/api/merchants/:merchantId", ({ params }) => {
    const merchant = merchants.find((m) => m.id === params.merchantId);
    if (!merchant) {
      return HttpResponse.json({ code: 404, message: "No such merchant" }, { status: 404 });
    }
    return HttpResponse.json(merchant);
  }),

  // Approve or reject a pending submission. merchants:review.
  http.post("/api/merchants/:merchantId/review", async ({ params, request }) => {
    const merchant = merchants.find((m) => m.id === params.merchantId);
    if (!merchant) {
      return HttpResponse.json({ code: 404, message: "No such merchant" }, { status: 404 });
    }
    const body = (await request.json()) as { decision: "approved" | "rejected"; reason?: string };
    merchants = merchants.map((m) => (m.id === merchant.id ? { ...m, status: body.decision } : m));
    return HttpResponse.json(merchants.find((m) => m.id === merchant.id));
  }),

  // Suspend or reactivate. merchants:suspend.
  http.post("/api/merchants/:merchantId/suspend", async ({ params, request }) => {
    const merchant = merchants.find((m) => m.id === params.merchantId);
    if (!merchant) {
      return HttpResponse.json({ code: 404, message: "No such merchant" }, { status: 404 });
    }
    const body = (await request.json()) as { suspended: boolean };
    const nextStatus = body.suspended ? "suspended" : "approved";
    merchants = merchants.map((m) => (m.id === merchant.id ? { ...m, status: nextStatus } : m));
    return HttpResponse.json(merchants.find((m) => m.id === merchant.id));
  }),

  // Every transaction, optionally filtered by merchant/status. transactions:read-all.
  http.get("/api/transactions", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const merchantId = url.searchParams.get("merchantId");
    let filtered = transactions;
    if (status) filtered = filtered.filter((t) => t.status === status);
    if (merchantId) filtered = filtered.filter((t) => t.merchantId === merchantId);
    return HttpResponse.json(paginated(filtered, url));
  }),

  // Every dispute, optionally filtered by status. disputes:read-all.
  http.get("/api/disputes", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const filtered = status ? disputes.filter((d) => d.status === status) : disputes;
    return HttpResponse.json(paginated(filtered, url));
  }),

  // Resolve a dispute. disputes:resolve.
  http.post("/api/disputes/:disputeId/resolve", async ({ params, request }) => {
    const dispute = disputes.find((d) => d.id === params.disputeId);
    if (!dispute) {
      return HttpResponse.json({ code: 404, message: "No such dispute" }, { status: 404 });
    }
    const body = (await request.json()) as { outcome: "resolved-merchant" | "resolved-customer"; notes?: string };
    disputes = disputes.map((d) =>
      d.id === dispute.id ? { ...d, status: body.outcome, resolvedAt: new Date().toISOString() } : d,
    );
    // The transaction the dispute was raised on stops being "disputed" once resolved.
    transactions = transactions.map((t) =>
      t.id === dispute.transactionId ? { ...t, status: body.outcome === "resolved-customer" ? "refunded" : "completed" } : t,
    );
    return HttpResponse.json(disputes.find((d) => d.id === dispute.id));
  }),
];

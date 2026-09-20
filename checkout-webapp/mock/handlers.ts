import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/payments-api";

type PaymentLinkPublic = components["schemas"]["PaymentLinkPublic"];
type Transaction = components["schemas"]["Transaction"];
type PaymentRequest = components["schemas"]["PaymentRequest"];

// Seed values match wireframes.dsl's own example data (`node
// .claude/skills/wireframes/scripts/seed.mjs specs/design/components/checkout-webapp/wireframes.dsl`)
// so the mock's screens agree with the rendered wireframe.
//
// State lives here, in module scope: it resets on every full page load
// (a fresh open, a reload, a typed URL) and only carries forward across
// in-app navigation — the same reset a real page load would see if the
// underlying transaction were re-fetched, and it is what makes a repeated
// verification run repeatable.
let paymentLinks: Record<string, PaymentLinkPublic> = {
  "demo-link": {
    id: "demo-link",
    merchantName: "Acme Traders",
    amount: 5000,
    currency: "NGN",
    description: "Order #204",
    status: "open",
  },
  "paid-link": {
    id: "paid-link",
    merchantName: "Acme Traders",
    amount: 2500,
    currency: "NGN",
    description: "Order #199",
    status: "paid",
  },
  "expired-link": {
    id: "expired-link",
    merchantName: "Acme Traders",
    amount: 1200,
    currency: "NGN",
    description: "Order #150",
    status: "expired",
  },
};

let nextTransactionId = 1;

export const handlers = [
  http.get("/api/payment-links/:linkId", ({ params }) => {
    const link = paymentLinks[params.linkId as string];
    if (!link) {
      return HttpResponse.json({ code: 404, message: "No such payment link" }, { status: 404 });
    }
    return HttpResponse.json(link);
  }),

  http.post("/api/payment-links/:linkId/pay", async ({ params, request }) => {
    const linkId = params.linkId as string;
    const link = paymentLinks[linkId];
    if (!link) {
      return HttpResponse.json({ code: 404, message: "No such payment link" }, { status: 404 });
    }
    const body = (await request.json()) as PaymentRequest;
    if (body.method === "mobile_money" && !body.phoneNumber) {
      return HttpResponse.json({ code: 400, message: "phoneNumber is required for mobile_money" }, { status: 400 });
    }
    if (body.method === "card" && !body.cardToken) {
      return HttpResponse.json({ code: 400, message: "cardToken is required for card" }, { status: 400 });
    }
    if (link.status !== "open") {
      return HttpResponse.json({ code: 400, message: "This payment link is not open" }, { status: 400 });
    }

    // A mobile money number ending in 0 models a declined payment, so the
    // failure branch of PaymentResult is reachable in the walk without a
    // dedicated screen for it (the wireframe draws only the success badge).
    const declined = body.method === "mobile_money" && body.phoneNumber?.trim().endsWith("0");

    const transaction: Transaction = {
      id: `txn_${String(nextTransactionId++)}`,
      paymentLinkId: linkId,
      merchantId: "merchant_acme",
      method: body.method,
      amount: link.amount,
      currency: link.currency,
      status: declined ? "failed" : "completed",
      createdAt: new Date().toISOString(),
    };

    if (!declined) {
      paymentLinks = { ...paymentLinks, [linkId]: { ...link, status: "paid" } };
    }

    return HttpResponse.json(transaction, { status: 202 });
  }),
];

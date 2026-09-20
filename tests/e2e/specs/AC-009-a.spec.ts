// spec: tests/validation/test-plan.md § AC-009-a
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken, signInNewContext } from "../lib/auth";
import { target } from "../lib/targets";
import {
  api,
  authHeaders,
  createPaymentLink,
  ensureApprovedMerchant,
  payPaymentLink,
  uniqueMerchantInput,
} from "../lib/fixtures";

test("AC-009-a: a merchant can request a payout of their available balance", async ({ page, request, browser }) => {
  // 1. Sign in, ensure an approved merchant with a completed transaction (balance > 0)
  await uiSignIn(
    page,
    target("merchant-webapp"),
    process.env.AEP_E2E_MERCHANT_USERNAME!,
    process.env.AEP_E2E_MERCHANT_PASSWORD!,
  );
  const merchantToken = await accessToken(page);

  const admin = await signInNewContext(
    browser,
    target("admin-webapp"),
    process.env.AEP_E2E_ADMIN_USERNAME!,
    process.env.AEP_E2E_ADMIN_PASSWORD!,
  );
  try {
    await ensureApprovedMerchant(request, merchantToken, admin.token, uniqueMerchantInput(Date.now().toString()));
  } finally {
    await admin.close();
  }
  const link = await createPaymentLink(request, merchantToken, {
    amount: 5000,
    currency: "NGN",
    description: `Order ${Date.now()}`,
  });
  await payPaymentLink(request, link.id, "mobile_money");
  await expect(async () => {
    const res = await request.get(`${api()}/me/transactions`, { headers: authHeaders(merchantToken) });
    const { data } = await res.json();
    expect(data.find((t: { paymentLinkId: string }) => t.paymentLinkId === link.id)?.status).toBe("completed");
  }).toPass({ timeout: 10_000 });

  // 2. Request an on-demand payout
  const res = await request.post(`${api()}/me/payouts`, { headers: authHeaders(merchantToken) });

  // 3. Assert the payout was accepted
  expect(res.status(), await res.text()).toBe(201);
  const payout = await res.json();
  expect(payout.type).toBe("manual");
});

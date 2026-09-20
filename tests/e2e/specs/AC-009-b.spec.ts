// spec: tests/validation/test-plan.md § AC-009-b
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

test("AC-009-b: a requested payout appears in the merchant's payout history with a status", async ({
  page,
  request,
  browser,
}) => {
  // 1. Sign in, ensure an approved merchant with a completed transaction, and request a payout
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
  const payoutRes = await request.post(`${api()}/me/payouts`, { headers: authHeaders(merchantToken) });
  expect(payoutRes.status(), await payoutRes.text()).toBe(201);

  // 2. Open the payout history
  await page.goto(new URL("/payouts", target("merchant-webapp")).toString());

  // 3. Assert the payout is visible with a status
  const row = page.getByRole("row", { name: /Manual/i }).first();
  await expect(row).toBeVisible();
  await expect(row.getByRole("cell").last()).not.toBeEmpty();
});

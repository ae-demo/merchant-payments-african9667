// spec: tests/validation/test-plan.md § AC-008-a
//
// payments-api sends the merchant's payment-completed notification via
// email-service/sms-service (payments-api/notify.bal) — outside this
// suite's reach. This checks the API-observable side effect the design's
// customer-payment.md flow ties the notification to: the transaction
// transitioning to `completed`.
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

test("AC-008-a: a merchant receives a notification when a customer's payment completes", async ({
  page,
  request,
  browser,
}) => {
  // 1. Sign in, ensure an approved merchant, create and pay a payment link
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

  // 2. Assert the transaction the notification is tied to reflects completion
  await expect(async () => {
    const res = await request.get(`${api()}/me/transactions`, { headers: authHeaders(merchantToken) });
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    const tx = data.find((t: { paymentLinkId: string }) => t.paymentLinkId === link.id);
    expect(tx?.status).toBe("completed");
  }).toPass({ timeout: 10_000 });
});

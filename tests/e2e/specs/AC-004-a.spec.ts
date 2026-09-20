// spec: tests/validation/test-plan.md § AC-004-a
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken, signInNewContext } from "../lib/auth";
import { target } from "../lib/targets";
import { api, authHeaders, ensureApprovedMerchant, uniqueMerchantInput } from "../lib/fixtures";

test("AC-004-a: a merchant can create a payment link specifying an amount and a description", async ({
  page,
  request,
  browser,
}) => {
  // 1. Sign in as the merchant and ensure an approved profile exists
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

  // 2. Create a payment link specifying an amount and a description
  const description = `Order ${Date.now()}`;
  const res = await request.post(`${api()}/me/payment-links`, {
    headers: authHeaders(merchantToken),
    data: { amount: 5000, currency: "NGN", description },
  });

  // 3. Assert it was created with the given amount and description
  expect(res.status(), await res.text()).toBe(201);
  const link = await res.json();
  expect(link.amount).toBe(5000);
  expect(link.description).toBe(description);
  expect(link.status).toBe("open");
});

// spec: tests/validation/test-plan.md § AC-003-b
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken } from "../lib/auth";
import { target } from "../lib/targets";
import { api, authHeaders, ensureMerchantProfile, uniqueMerchantInput } from "../lib/fixtures";

test("AC-003-b: a merchant cannot accept live payments until their submission is approved", async ({
  page,
  request,
}) => {
  // 1. Sign in and ensure a merchant profile exists
  await uiSignIn(
    page,
    target("merchant-webapp"),
    process.env.AEP_E2E_MERCHANT_USERNAME!,
    process.env.AEP_E2E_MERCHANT_PASSWORD!,
  );
  const token = await accessToken(page);
  const merchant = await ensureMerchantProfile(request, token, uniqueMerchantInput(Date.now().toString()));

  test.skip(
    merchant.status !== "pending",
    `merchant status is "${merchant.status}", not "pending" — the shared test identity has moved past this state`,
  );

  // 2. A pending (not yet approved) merchant attempts to create a payment link
  const res = await request.post(`${api()}/me/payment-links`, {
    headers: authHeaders(token),
    data: { amount: 1000, currency: "NGN", description: "test payment" },
  });

  // 3. Assert it is refused until approved
  expect(res.status(), await res.text()).toBe(400);
});

// spec: tests/validation/test-plan.md § AC-006-b
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken, signInNewContext } from "../lib/auth";
import { target } from "../lib/targets";
import { createPaymentLink, ensureApprovedMerchant, payPaymentLink, uniqueMerchantInput } from "../lib/fixtures";

test("AC-006-b: a merchant can view a history of their transactions", async ({ page, request, browser }) => {
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
  const description = `Order ${Date.now()}`;
  const link = await createPaymentLink(request, merchantToken, { amount: 5000, currency: "NGN", description });
  await payPaymentLink(request, link.id, "mobile_money");

  // 2. Open the transactions history
  await page.goto(new URL("/transactions", target("merchant-webapp")).toString());

  // 3. Assert the transaction for this link is visible
  await expect(page.getByRole("row", { name: new RegExp(description) })).toBeVisible();
});

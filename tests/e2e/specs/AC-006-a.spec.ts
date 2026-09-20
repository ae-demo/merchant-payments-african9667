// spec: tests/validation/test-plan.md § AC-006-a
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken, signInNewContext } from "../lib/auth";
import { target } from "../lib/targets";
import { createPaymentLink, ensureApprovedMerchant, uniqueMerchantInput } from "../lib/fixtures";

test("AC-006-a: a merchant can view a list of their payment links and each one's status", async ({
  page,
  request,
  browser,
}) => {
  // 1. Sign in, ensure an approved merchant, and create a payment link
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
  await createPaymentLink(request, merchantToken, { amount: 5000, currency: "NGN", description });

  // 2. Open the payment links list
  await page.goto(new URL("/payment-links", target("merchant-webapp")).toString());

  // 3. Assert the link and its status are visible
  const row = page.getByRole("row", { name: new RegExp(description) });
  await expect(row).toBeVisible();
  await expect(row.getByText("Open")).toBeVisible();
});

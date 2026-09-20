// spec: tests/validation/test-plan.md § AC-011-a
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken, signInNewContext } from "../lib/auth";
import { target } from "../lib/targets";
import { createPaymentLink, ensureApprovedMerchant, uniqueMerchantInput } from "../lib/fixtures";

test("AC-011-a: opening a payment link shows the amount owed and the merchant's name", async ({
  page,
  request,
  browser,
}) => {
  // 1. Set up an approved merchant and an open payment link
  const merchant = await signInNewContext(
    browser,
    target("merchant-webapp"),
    process.env.AEP_E2E_MERCHANT_USERNAME!,
    process.env.AEP_E2E_MERCHANT_PASSWORD!,
  );
  const admin = await signInNewContext(
    browser,
    target("admin-webapp"),
    process.env.AEP_E2E_ADMIN_USERNAME!,
    process.env.AEP_E2E_ADMIN_PASSWORD!,
  );
  let link: { id: string };
  try {
    await ensureApprovedMerchant(request, merchant.token, admin.token, uniqueMerchantInput(Date.now().toString()));
    link = await createPaymentLink(request, merchant.token, {
      amount: 5000,
      currency: "NGN",
      description: `Order ${Date.now()}`,
    });
  } finally {
    await merchant.close();
    await admin.close();
  }

  // 2. A customer opens the payment link on the hosted checkout page (no sign-in)
  await page.goto(new URL(`/${link.id}`, target("checkout-webapp")).toString());

  // 3. Assert the amount owed and merchant name are shown
  await expect(page.getByText("Amount due")).toBeVisible();
  await expect(page.getByText(/5,000|5000/)).toBeVisible();
  await expect(page.getByText(/to .+/)).toBeVisible();
});

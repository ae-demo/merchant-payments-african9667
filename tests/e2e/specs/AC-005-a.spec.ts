// spec: tests/validation/test-plan.md § AC-005-a
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken, signInNewContext } from "../lib/auth";
import { target } from "../lib/targets";
import { createPaymentLink, ensureApprovedMerchant, uniqueMerchantInput } from "../lib/fixtures";

test("AC-005-a: a created payment link is available as a shareable link a customer can open", async ({
  page,
  request,
  browser,
}) => {
  // 1. Sign in as the merchant, ensure an approved profile, and create a link
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

  // 2. Read the shareable link displayed on the payment link's detail screen
  await page.goto(new URL(`/payment-links/${link.id}`, target("merchant-webapp")).toString());
  const shareUrl = await page.getByText(/^https?:\/\//).textContent();
  expect(shareUrl, "no shareable URL rendered on the payment link detail screen").toBeTruthy();

  // 3. Assert the displayed link actually opens the checkout page for this link
  await page.goto(shareUrl!.trim());
  await expect(page.getByText(/Amount due/i)).toBeVisible();
});

// spec: tests/validation/test-plan.md § AC-007-a
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken, signInNewContext } from "../lib/auth";
import { target } from "../lib/targets";
import { ensureApprovedMerchant, uniqueMerchantInput } from "../lib/fixtures";

test("AC-007-a: a merchant can view their current available balance", async ({ page, request, browser }) => {
  // 1. Sign in and ensure an approved merchant profile
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

  // 2. Open the dashboard
  await page.goto(new URL("/dashboard", target("merchant-webapp")).toString());

  // 3. Assert the available balance card renders a formatted amount
  await expect(page.getByText("Available balance")).toBeVisible();
  const card = page.getByText("Available balance").locator("..");
  await expect(card.getByText(/[\d,]+(\.\d+)?\s*(NGN|KES|GHS)/)).toBeVisible();
});

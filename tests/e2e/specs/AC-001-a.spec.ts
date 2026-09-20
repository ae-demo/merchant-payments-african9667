// spec: tests/validation/test-plan.md § AC-001-a
import { test, expect } from "@playwright/test";
import { uiSignIn } from "../lib/auth";
import { target } from "../lib/targets";

test("AC-001-a: a new user can create a merchant account", async ({ page }) => {
  // 1. Sign in as the Merchant-role test user
  await uiSignIn(
    page,
    target("merchant-webapp"),
    process.env.AEP_E2E_MERCHANT_USERNAME!,
    process.env.AEP_E2E_MERCHANT_PASSWORD!,
  );

  // A merchant profile is a one-time, permanent transition for this identity
  // (owner_user_id is UNIQUE) — if one already exists, the dashboard must
  // actually render the merchant's status (not just resolve the route: a
  // profile GET that errors leaves the Dashboard on its loading skeleton
  // forever, per merchant-webapp/src/lib/useMerchant.ts).
  if (/\/dashboard$/.test(page.url())) {
    await expect(page.getByText(/Approved|Pending|Rejected|Suspended/)).toBeVisible();
    return;
  }

  // 2. Fill and submit the onboarding form (business + bank details)
  await expect(page.getByRole("heading", { name: "Complete your business profile" })).toBeVisible();
  const run = Date.now().toString();
  await page.getByRole("textbox", { name: "Business name" }).fill(`Acme Traders ${run}`);
  await page.getByRole("textbox", { name: "Registration number" }).fill(`RC-${run}`);
  await page.getByRole("textbox", { name: "Account name" }).fill("Acme Traders Ltd");
  await page.getByRole("textbox", { name: "Account number" }).fill("0123456789");
  await page.getByRole("textbox", { name: "Bank name" }).fill("GTBank");
  await page.getByRole("button", { name: "Submit for review" }).click();

  // 3. Assert the account was created: no error, and the app lands on the dashboard
  await expect(page).toHaveURL(/\/dashboard$/);
});

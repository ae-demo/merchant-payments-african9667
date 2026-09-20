// spec: tests/validation/test-plan.md § AC-002-a
import { test, expect } from "@playwright/test";
import { uiSignIn } from "../lib/auth";
import { target } from "../lib/targets";

test("AC-002-a: a merchant can sign in via SSO and reach their account", async ({ page }) => {
  // 1. Sign in as the Merchant-role test user
  await uiSignIn(
    page,
    target("merchant-webapp"),
    process.env.AEP_E2E_MERCHANT_USERNAME!,
    process.env.AEP_E2E_MERCHANT_PASSWORD!,
  );
  // 2. Assert the app rendered its own authenticated shell (left the IdP host)
  const merchantHost = new URL(target("merchant-webapp")).host;
  expect(new URL(page.url()).host).toBe(merchantHost);
  await expect(page.getByRole("button", { name: "Account" })).toBeVisible();
});

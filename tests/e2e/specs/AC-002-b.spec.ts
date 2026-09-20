// spec: tests/validation/test-plan.md § AC-002-b
import { test, expect } from "@playwright/test";
import { uiSignIn } from "../lib/auth";
import { target } from "../lib/targets";

test("AC-002-b: a Platform Admin can sign in via SSO and reach the admin console", async ({ page }) => {
  // 1. Sign in as the PlatformAdmin-role test user
  await uiSignIn(
    page,
    target("admin-webapp"),
    process.env.AEP_E2E_ADMIN_USERNAME!,
    process.env.AEP_E2E_ADMIN_PASSWORD!,
  );
  // 2. Assert the Admin Console shell renders
  await expect(page.getByRole("link", { name: "Onboarding" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Merchants" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Transactions" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Disputes" })).toBeVisible();
});

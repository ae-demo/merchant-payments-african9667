// spec: tests/validation/test-plan.md § AC-015-a
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken, signInNewContext } from "../lib/auth";
import { target } from "../lib/targets";
import { ensureMerchantProfile, uniqueMerchantInput } from "../lib/fixtures";

test("AC-015-a: a Platform Admin can view a list of pending merchant onboarding submissions", async ({
  page,
  request,
  browser,
}) => {
  // 1. Ensure a pending merchant submission exists
  const merchant = await signInNewContext(
    browser,
    target("merchant-webapp"),
    process.env.AEP_E2E_MERCHANT_USERNAME!,
    process.env.AEP_E2E_MERCHANT_PASSWORD!,
  );
  const input = uniqueMerchantInput(Date.now().toString());
  let profile: { status: string };
  try {
    profile = await ensureMerchantProfile(request, merchant.token, input);
  } finally {
    await merchant.close();
  }
  test.skip(profile.status !== "pending", `merchant status is "${profile.status}", not "pending"`);

  // 2. Sign in as admin and open the onboarding queue
  await uiSignIn(
    page,
    target("admin-webapp"),
    process.env.AEP_E2E_ADMIN_USERNAME!,
    process.env.AEP_E2E_ADMIN_PASSWORD!,
  );
  await page.goto(new URL("/onboarding", target("admin-webapp")).toString());

  // 3. Assert the pending submission is listed
  await expect(page.getByRole("row", { name: new RegExp(input.businessName) })).toBeVisible();
});

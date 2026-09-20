// spec: tests/validation/test-plan.md § AC-016-a
//
// Shared-identity constraint (test-plan.md): only one Merchant-role test
// identity is provisioned, so a genuine "belongs to more than one merchant"
// check isn't fixturable here. This verifies the admin all-transactions view
// surfaces test-merchant's own transaction from the all-merchants endpoint
// (proving the view is NOT scoped to a single caller's own data, which is
// the mechanism the criterion cares about) rather than fabricating a second
// merchant identity.
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken, signInNewContext } from "../lib/auth";
import { target } from "../lib/targets";
import { createPaymentLink, ensureApprovedMerchant, payPaymentLink, uniqueMerchantInput } from "../lib/fixtures";

test("AC-016-a: a Platform Admin can view transactions belonging to any merchant, not just one", async ({
  page,
  request,
  browser,
}) => {
  // 1. Set up an approved merchant with a completed transaction
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
  let businessName: string;
  try {
    const profile = await ensureApprovedMerchant(
      request,
      merchant.token,
      admin.token,
      uniqueMerchantInput(Date.now().toString()),
    );
    businessName = profile.businessName as string;
    const link = await createPaymentLink(request, merchant.token, {
      amount: 5000,
      currency: "NGN",
      description: `Order ${Date.now()}`,
    });
    await payPaymentLink(request, link.id, "mobile_money");
  } finally {
    await merchant.close();
  }

  // 2. The admin (not the merchant) views the cross-merchant transactions screen
  await page.goto(new URL("/transactions", target("admin-webapp")).toString());

  // 3. Assert the merchant's transaction is visible from the admin's own view,
  // joined by business name — the admin table has no per-link description column.
  await expect(page.getByRole("row", { name: new RegExp(businessName) })).toBeVisible();
  await admin.close();
});

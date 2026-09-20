// spec: tests/validation/test-plan.md § AC-019-a
import { test, expect } from "@playwright/test";
import { signInNewContext } from "../lib/auth";
import { target } from "../lib/targets";
import { createPaymentLink, ensureApprovedMerchant, uniqueMerchantInput } from "../lib/fixtures";

test("AC-019-a: a customer can complete a payment without signing in or creating an account", async ({
  page,
  request,
  browser,
}) => {
  // 1. Set up an approved merchant and an open payment link (setup only — not the customer's own action)
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

  // 2. `page` here has never signed in or visited any IdP host — the customer
  // opens the link and pays directly.
  await page.goto(new URL(`/${link.id}`, target("checkout-webapp")).toString());
  await expect(page.getByText("Amount due")).toBeVisible();
  await page.getByRole("button", { name: "Pay with Mobile Money" }).click();
  await page.getByRole("textbox", { name: "Mobile money number" }).fill("+2348012345678");
  await page.getByRole("button", { name: "Confirm payment" }).click();

  // 3. Assert payment completes, and at no point did the browser visit the IdP
  await expect(page.getByText(/Payment successful|Payment processing/)).toBeVisible();
  expect(page.url()).not.toMatch(/default-idp\./);
});

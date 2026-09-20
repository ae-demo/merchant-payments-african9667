// spec: tests/validation/test-plan.md § AC-012-a
import { test, expect } from "@playwright/test";
import { signInNewContext } from "../lib/auth";
import { target } from "../lib/targets";
import { createPaymentLink, ensureApprovedMerchant, uniqueMerchantInput } from "../lib/fixtures";

test("AC-012-a: a customer can complete payment of a payment link using mobile money", async ({
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

  // 2. A customer opens the link and pays via mobile money
  await page.goto(new URL(`/${link.id}`, target("checkout-webapp")).toString());
  await page.getByRole("button", { name: "Pay with Mobile Money" }).click();
  await page.getByRole("textbox", { name: "Mobile money number" }).fill("+2348012345678");
  await page.getByRole("button", { name: "Confirm payment" }).click();

  // 3. Assert the outcome screen shows the payment as successful or processing
  await expect(page.getByText(/Payment successful|Payment processing/)).toBeVisible();
});

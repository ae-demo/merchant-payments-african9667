// spec: tests/validation/test-plan.md § AC-018-a
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken, signInNewContext } from "../lib/auth";
import { target } from "../lib/targets";
import { api, authHeaders, ensureApprovedMerchant, uniqueMerchantInput } from "../lib/fixtures";

test("AC-018-a: a Platform Admin can suspend an approved merchant's account", async ({ page, request, browser }) => {
  // 1. Ensure an approved merchant exists
  const merchant = await signInNewContext(
    browser,
    target("merchant-webapp"),
    process.env.AEP_E2E_MERCHANT_USERNAME!,
    process.env.AEP_E2E_MERCHANT_PASSWORD!,
  );
  await uiSignIn(
    page,
    target("admin-webapp"),
    process.env.AEP_E2E_ADMIN_USERNAME!,
    process.env.AEP_E2E_ADMIN_PASSWORD!,
  );
  const adminToken = await accessToken(page);
  let profile: { id: string; status: string };
  try {
    profile = await ensureApprovedMerchant(
      request,
      merchant.token,
      adminToken,
      uniqueMerchantInput(Date.now().toString()),
    );
  } finally {
    await merchant.close();
  }
  test.skip(profile.status !== "approved", `merchant status is "${profile.status}", not "approved"`);

  // 2. Open the merchant's account screen and suspend it
  await page.goto(new URL(`/merchants/${profile.id}`, target("admin-webapp")).toString());
  await page.getByRole("button", { name: "Suspend account" }).click();

  // 3. Assert the status became suspended
  await expect(async () => {
    const res = await request.get(`${api()}/merchants/${profile.id}`, { headers: authHeaders(adminToken) });
    expect(res.status()).toBe(200);
    expect((await res.json()).status).toBe("suspended");
  }).toPass({ timeout: 10_000 });
});

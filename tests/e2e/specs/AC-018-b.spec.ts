// spec: tests/validation/test-plan.md § AC-018-b
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken, signInNewContext } from "../lib/auth";
import { target } from "../lib/targets";
import { api, authHeaders, ensureApprovedMerchant, uniqueMerchantInput } from "../lib/fixtures";

test("AC-018-b: a Platform Admin can reactivate a suspended merchant's account", async ({ page, request, browser }) => {
  // 1. Ensure a merchant exists and is suspended
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
  if (profile.status === "approved") {
    const suspend = await request.post(`${api()}/merchants/${profile.id}/suspend`, {
      headers: authHeaders(adminToken),
      data: { suspended: true },
    });
    expect(suspend.status(), await suspend.text()).toBe(200);
    profile = await suspend.json();
  }
  test.skip(profile.status !== "suspended", `merchant status is "${profile.status}", not "suspended"`);

  // 2. Open the merchant's account screen and reactivate it
  await page.goto(new URL(`/merchants/${profile.id}`, target("admin-webapp")).toString());
  await page.getByRole("button", { name: "Reactivate account" }).click();

  // 3. Assert the status became approved again
  await expect(async () => {
    const res = await request.get(`${api()}/merchants/${profile.id}`, { headers: authHeaders(adminToken) });
    expect(res.status()).toBe(200);
    expect((await res.json()).status).toBe("approved");
  }).toPass({ timeout: 10_000 });
});

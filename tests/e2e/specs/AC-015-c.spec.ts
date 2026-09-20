// spec: tests/validation/test-plan.md § AC-015-c
//
// Shared-identity constraint (test-plan.md): only one Merchant-role test
// identity exists, so this cannot fixture an independent pending merchant
// once AC-015-b has already approved it in the same run — it skips rather
// than fabricate a second identity or misreport a reject of an
// already-decided merchant as this criterion.
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken, signInNewContext } from "../lib/auth";
import { target } from "../lib/targets";
import { api, authHeaders, ensureMerchantProfile, uniqueMerchantInput } from "../lib/fixtures";

test("AC-015-c: a Platform Admin can reject a pending merchant submission", async ({ page, request, browser }) => {
  const merchant = await signInNewContext(
    browser,
    target("merchant-webapp"),
    process.env.AEP_E2E_MERCHANT_USERNAME!,
    process.env.AEP_E2E_MERCHANT_PASSWORD!,
  );
  const input = uniqueMerchantInput(Date.now().toString());
  let profile: { id: string; status: string };
  try {
    profile = await ensureMerchantProfile(request, merchant.token, input);
  } finally {
    await merchant.close();
  }
  test.skip(
    profile.status !== "pending",
    `merchant status is "${profile.status}", not "pending" — the shared test identity has already been decided this run`,
  );

  // 1. Sign in as admin, open the submission, and reject it
  await uiSignIn(
    page,
    target("admin-webapp"),
    process.env.AEP_E2E_ADMIN_USERNAME!,
    process.env.AEP_E2E_ADMIN_PASSWORD!,
  );
  await page.goto(new URL(`/onboarding/${profile.id}`, target("admin-webapp")).toString());
  await page.getByRole("button", { name: "Reject" }).click();

  // 2. Assert the merchant's status became rejected
  const adminToken = await accessToken(page);
  await expect(async () => {
    const res = await request.get(`${api()}/merchants/${profile.id}`, { headers: authHeaders(adminToken) });
    expect(res.status()).toBe(200);
    expect((await res.json()).status).toBe("rejected");
  }).toPass({ timeout: 10_000 });
});

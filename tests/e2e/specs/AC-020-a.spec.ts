// spec: tests/validation/test-plan.md § AC-020-a
//
// Shared-identity constraint (test-plan.md): test-merchant can hold exactly
// one profile, and AC-001-a/003-a may already have created it with a
// particular country. This creates one with Kenya/KES if none exists yet;
// otherwise it verifies the existing profile's country/currency pairing is
// one of the three the design declares.
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken } from "../lib/auth";
import { target } from "../lib/targets";
import { api, authHeaders } from "../lib/fixtures";

const VALID_PAIRS: Record<string, string> = { NG: "NGN", KE: "KES", GH: "GHS" };

test("AC-020-a: a merchant can register under Nigeria, Kenya, or Ghana with the matching currency", async ({
  page,
  request,
}) => {
  await uiSignIn(
    page,
    target("merchant-webapp"),
    process.env.AEP_E2E_MERCHANT_USERNAME!,
    process.env.AEP_E2E_MERCHANT_PASSWORD!,
  );
  const token = await accessToken(page);

  const existing = await request.get(`${api()}/me/merchant`, { headers: authHeaders(token) });
  if (existing.status() === 404) {
    const run = Date.now().toString();
    const created = await request.post(`${api()}/me/merchant`, {
      headers: authHeaders(token),
      data: {
        businessName: `Kilimo Foods ${run}`,
        registrationNumber: `RC-${run}`,
        country: "KE",
        currency: "KES",
        bankAccount: { accountName: "Kilimo Foods Ltd", accountNumber: "0987654321", bankName: "Equity Bank" },
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const merchant = await created.json();
    expect(merchant.country).toBe("KE");
    expect(merchant.currency).toBe("KES");
    return;
  }

  expect(existing.status(), await existing.text()).toBe(200);
  const merchant = await existing.json();
  expect(Object.keys(VALID_PAIRS)).toContain(merchant.country);
  expect(merchant.currency).toBe(VALID_PAIRS[merchant.country]);
});

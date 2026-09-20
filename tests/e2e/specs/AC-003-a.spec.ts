// spec: tests/validation/test-plan.md § AC-003-a
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken } from "../lib/auth";
import { target } from "../lib/targets";
import { api, authHeaders, uniqueMerchantInput } from "../lib/fixtures";

test("AC-003-a: a merchant can submit business details and a bank account", async ({ page, request }) => {
  // 1. Sign in as the Merchant-role test user and get its bearer token
  await uiSignIn(
    page,
    target("merchant-webapp"),
    process.env.AEP_E2E_MERCHANT_USERNAME!,
    process.env.AEP_E2E_MERCHANT_PASSWORD!,
  );
  const token = await accessToken(page);
  const input = uniqueMerchantInput(Date.now().toString());

  // 2. Submit business + bank details (or, if already submitted in an
  // earlier run, read back what was submitted — the profile is one-time).
  const existing = await request.get(`${api()}/me/merchant`, { headers: authHeaders(token) });
  if (existing.status() === 404) {
    const created = await request.post(`${api()}/me/merchant`, { headers: authHeaders(token), data: input });
    expect(created.status(), await created.text()).toBe(201);
    const merchant = await created.json();
    expect(merchant.bankAccount).toMatchObject(input.bankAccount);
    return;
  }

  // 3. Assert the bank account on file is complete
  expect(existing.status(), await existing.text()).toBe(200);
  const merchant = await existing.json();
  expect(merchant.bankAccount?.accountName).toBeTruthy();
  expect(merchant.bankAccount?.accountNumber).toBeTruthy();
  expect(merchant.bankAccount?.bankName).toBeTruthy();
});

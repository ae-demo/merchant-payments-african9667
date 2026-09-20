// spec: tests/validation/test-plan.md § AC-021-b
//
// See AC-021-a: no dispute can ever be raised in this deployment, so there
// is nothing to resolve in the merchant's favor to check a reversal against.
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken } from "../lib/auth";
import { target } from "../lib/targets";
import { api, authHeaders } from "../lib/fixtures";

test("AC-021-b: resolving a dispute in the merchant's favor reverses the earlier debit", async ({
  page,
  request,
}) => {
  await uiSignIn(
    page,
    target("admin-webapp"),
    process.env.AEP_E2E_ADMIN_USERNAME!,
    process.env.AEP_E2E_ADMIN_PASSWORD!,
  );
  const token = await accessToken(page);

  const res = await request.get(`${api()}/disputes`, { headers: authHeaders(token), params: { status: "open" } });
  expect(res.status(), await res.text()).toBe(200);
  const { data } = await res.json();
  expect(
    data.length,
    "no open dispute exists — payments-api exposes no operation to raise a dispute, see AC-021-a",
  ).toBeGreaterThan(0);
});

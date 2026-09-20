// spec: tests/validation/test-plan.md § AC-021-a
//
// payments-api's contract exposes no operation to raise a dispute at all
// (confirmed by source: payments-api/dispute_store.bal's `raiseDispute` is
// never called from any resource function) — no actor, including this
// suite, has a way to put a transaction into the `disputed` state. This
// asserts one exists, which fails honestly rather than reporting a false
// pass on an untestable rule.
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken } from "../lib/auth";
import { target } from "../lib/targets";
import { api, authHeaders } from "../lib/fixtures";

test("AC-021-a: raising a dispute on a transaction reduces the merchant's available balance", async ({
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

  const res = await request.get(`${api()}/me/transactions`, {
    headers: authHeaders(token),
    params: { status: "disputed" },
  });
  expect(res.status(), await res.text()).toBe(200);
  const { data } = await res.json();
  expect(
    data.length,
    "no disputed transaction exists — payments-api exposes no operation to raise a dispute, see dispute_store.bal",
  ).toBeGreaterThan(0);
});

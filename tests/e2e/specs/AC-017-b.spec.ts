// spec: tests/validation/test-plan.md § AC-017-b
//
// See AC-017-a: no actor can raise a dispute in this deployment
// (payments-api exposes no such operation), so there is never one to
// resolve. This asserts one exists before attempting the resolution, which
// fails honestly at that point rather than reporting a false pass.
import { test, expect } from "@playwright/test";
import { uiSignIn, accessToken } from "../lib/auth";
import { target } from "../lib/targets";
import { api, authHeaders } from "../lib/fixtures";

test("AC-017-b: a Platform Admin can resolve a dispute in favor of the merchant", async ({ page, request }) => {
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
  expect(data.length, "no open dispute exists to resolve — see AC-017-a").toBeGreaterThan(0);

  const resolveRes = await request.post(`${api()}/disputes/${data[0].id}/resolve`, {
    headers: authHeaders(token),
    data: { outcome: "resolved-merchant" },
  });
  expect(resolveRes.status(), await resolveRes.text()).toBe(200);
  expect((await resolveRes.json()).status).toBe("resolved-merchant");
});

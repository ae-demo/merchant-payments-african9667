// spec: tests/validation/test-plan.md § AC-017-a
//
// payments-api's contract has no operation that raises a dispute
// (payments-api/dispute_store.bal's own header comment confirms this) — no
// actor can ever put a row in `disputes`. This asserts the queue actually
// lists a disputed transaction, which is the only way to validate the
// criterion meaningfully rather than an empty screen that could just as
// easily mean "the feature renders" as "it works".
import { test, expect } from "@playwright/test";
import { uiSignIn } from "../lib/auth";
import { target } from "../lib/targets";

test("AC-017-a: a Platform Admin can view a list of disputed transactions", async ({ page }) => {
  await uiSignIn(
    page,
    target("admin-webapp"),
    process.env.AEP_E2E_ADMIN_USERNAME!,
    process.env.AEP_E2E_ADMIN_PASSWORD!,
  );
  await page.goto(new URL("/disputes", target("admin-webapp")).toString());
  await expect(page.getByRole("heading", { name: "Open disputes" })).toBeVisible();

  // A row in the table — i.e. an actual disputed transaction is listed, not
  // just the (permanently) empty state.
  await expect(page.getByRole("row").nth(1)).toBeVisible({ timeout: 5_000 });
});

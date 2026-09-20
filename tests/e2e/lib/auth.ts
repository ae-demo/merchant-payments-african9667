// Shared sign-in helper for the Thunder Auth gate used by merchant-webapp and
// admin-webapp. Both apps redirect an unauthenticated visitor straight to the
// IdP's hosted gate — this drives that form and waits for the redirect back.
import { expect, type Browser, type Page } from "@playwright/test";

export async function uiSignIn(page: Page, baseUrl: string, username: string, password: string): Promise<void> {
  await page.goto(baseUrl);
  // A signed-out visitor briefly shows "Checking your session…" while the app
  // tries a silent renew before redirecting to the IdP gate; the deployment's
  // own backend load (many 500s from DEFECT-1) can stretch this past the
  // default 10s expect timeout, so this waits longer rather than assuming a
  // fixed delay.
  await expect(page.getByRole("textbox", { name: "Username" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  // Wait until the redirect back to the app has landed (URL leaves the IdP host).
  await expect(page).not.toHaveURL(/default-idp\./, { timeout: 15_000 });
}

/** The bearer token oidc-client-ts stored in localStorage after sign-in. */
export async function accessToken(page: Page): Promise<string> {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith("oidc.user:"));
    if (!key) throw new Error("no oidc session in localStorage — sign-in did not complete");
    const stored = JSON.parse(localStorage.getItem(key) as string) as { access_token: string };
    return stored.access_token;
  });
}

/**
 * Signs in as a second identity in its own browser context — for specs that
 * need both a merchant and an admin token (e.g. create-then-approve), since
 * a single `page` can only hold one signed-in session at a time.
 */
export async function signInNewContext(
  browser: Browser,
  baseUrl: string,
  username: string,
  password: string,
): Promise<{ page: Page; token: string; close: () => Promise<void> }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await uiSignIn(page, baseUrl, username, password);
  const token = await accessToken(page);
  return { page, token, close: () => context.close() };
}

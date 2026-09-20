// Shared sign-in helper for the Thunder Auth gate used by merchant-webapp and
// admin-webapp. Both apps redirect an unauthenticated visitor straight to the
// IdP's hosted gate — this drives that form and waits for the redirect back.
import { expect, type Page } from "@playwright/test";

export async function uiSignIn(page: Page, baseUrl: string, username: string, password: string): Promise<void> {
  await page.goto(baseUrl);
  await expect(page.getByRole("textbox", { name: "Username" })).toBeVisible();
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

// Shared payments-api setup helpers. A merchant profile is a one-time,
// permanent transition for a given identity (owner_user_id is UNIQUE), so
// every spec that needs an (approved) merchant checks for one before
// creating it rather than assuming a clean slate.
import type { APIRequestContext } from "@playwright/test";
import { target } from "./targets";

export function api(): string {
  return target("payments-api");
}

export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function uniqueMerchantInput(run: string) {
  return {
    businessName: `Acme Traders ${run}`,
    registrationNumber: `RC-${run}`,
    country: "NG" as const,
    currency: "NGN" as const,
    bankAccount: { accountName: "Acme Traders Ltd", accountNumber: "0123456789", bankName: "GTBank" },
  };
}

/**
 * Returns the caller's merchant profile, creating one if none exists yet.
 * Throws with a clear, attributable message if creation fails — the known
 * defect is that payments-api's row mapping crashes here (see AC-001-a).
 */
export async function ensureMerchantProfile(
  request: APIRequestContext,
  token: string,
  input: ReturnType<typeof uniqueMerchantInput>,
): Promise<{ id: string; status: string } & Record<string, unknown>> {
  const existing = await request.get(`${api()}/me/merchant`, { headers: authHeaders(token) });
  if (existing.status() === 200) return existing.json();
  if (existing.status() !== 404) {
    throw new Error(
      `GET /me/merchant returned ${existing.status()} (expected 200 or 404): ${await existing.text()}`,
    );
  }
  const created = await request.post(`${api()}/me/merchant`, { headers: authHeaders(token), data: input });
  if (created.status() !== 201) {
    throw new Error(
      `POST /me/merchant returned ${created.status()} (expected 201): ${await created.text()} ` +
        `— merchant creation is broken in this deployment, see AC-001-a`,
    );
  }
  return created.json();
}

/** Ensures the caller has a merchant profile AND it is approved by an admin. */
export async function ensureApprovedMerchant(
  request: APIRequestContext,
  merchantToken: string,
  adminToken: string,
  input: ReturnType<typeof uniqueMerchantInput>,
): Promise<{ id: string; status: string } & Record<string, unknown>> {
  const merchant = await ensureMerchantProfile(request, merchantToken, input);
  if (merchant.status === "approved") return merchant;
  const reviewed = await request.post(`${api()}/merchants/${merchant.id}/review`, {
    headers: authHeaders(adminToken),
    data: { decision: "approved" },
  });
  if (reviewed.status() !== 200) {
    throw new Error(`POST /merchants/${merchant.id}/review returned ${reviewed.status()}: ${await reviewed.text()}`);
  }
  return reviewed.json();
}

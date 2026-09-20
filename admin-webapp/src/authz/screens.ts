// THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS. Each row names the API
// operation the screen LOADS; the gate follows from whether the caller may
// call it (src/authz/core.ts#canCall), which is exactly the API gateway's own
// rule. Written from specs/design/components/admin-webapp/wireframes.dsl, in
// rail order — the sidebar walks Onboarding, Merchants, Transactions, Disputes
// — with the four drill-down screens after the list they are reached from.
//
// DisputeDetail has no dedicated "get one dispute" operation in payments-api's
// openapi.yaml (only GET /disputes and POST /disputes/{disputeId}/resolve), so
// it is gated the same way DisputesQueue is: on GET /disputes, the read this
// screen's content depends on (via the row the caller clicked, or a re-fetch
// on a direct visit). The write action itself is separately gated with
// <Can op="POST /disputes/{disputeId}/resolve"> around each resolve button.

import { canCall } from "./core";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  readonly key: string;
  readonly label: string;
  readonly path: string;
  readonly loads: OperationKey | null;
  readonly public?: boolean;
}

export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  { key: "onboarding-queue", label: "Onboarding", path: "/onboarding", loads: "GET /merchants" },
  { key: "merchants", label: "Merchants", path: "/merchants", loads: "GET /merchants" },
  { key: "all-transactions", label: "Transactions", path: "/transactions", loads: "GET /transactions" },
  { key: "disputes-queue", label: "Disputes", path: "/disputes", loads: "GET /disputes" },
  {
    key: "merchant-detail",
    label: "Review Merchant",
    path: "/onboarding/:merchantId",
    loads: "GET /merchants/{merchantId}",
  },
  {
    key: "merchant-account",
    label: "Merchant Account",
    path: "/merchants/:merchantId",
    loads: "GET /merchants/{merchantId}",
  },
  {
    key: "dispute-detail",
    label: "Dispute Detail",
    path: "/disputes/:disputeId",
    loads: "GET /disputes",
  },
];

for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

export function reachableScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return SCREEN_ROUTES.filter((screen) => {
    if (screen.public) return true;
    if (screen.loads === null) return signedIn;
    return canCall(OPERATIONS[screen.loads], scopes, signedIn);
  });
}

/** Only the rail's own screens — the landing candidates. */
export function reachableRailScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return reachableScreens(scopes, signedIn).filter((screen) => RAIL_KEYS.has(screen.key));
}

const RAIL_KEYS = new Set(["onboarding-queue", "merchants", "all-transactions", "disputes-queue"]);

export function hasScopedReach(scopes: ReadonlySet<string>, signedIn: boolean): boolean {
  return reachableScreens(scopes, signedIn).some((screen) => !screen.public && screen.loads !== null);
}

// THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS. Adapted from
// thunder-authentication's screens.example.ts pattern for merchant-webapp's
// own screens (specs/design/components/merchant-webapp/wireframes.dsl).
//
// Each row names the operation the screen exists to perform: the call it
// renders on load for a screen that reads, or the call its submit makes for a
// screen that only writes (Onboarding, CreatePaymentLink, PayoutConfirm).
//
// THE ORDER IS THE RAIL'S ORDER (the wireframes' sidebar: Dashboard, Payment
// Links, Transactions, Payouts), and the first reachable row is the screen
// the app lands on — so the four rail screens come first, ahead of the
// task screens (Onboarding, CreatePaymentLink, PaymentLinkDetail,
// PayoutConfirm) that are reached BY NAVIGATING from them rather than from
// the rail itself. This keeps the landing screen at Dashboard for every
// caller who already has a merchant profile; DashboardPage itself redirects
// a caller with no profile yet to Onboarding (a domain rule the generic
// screen table has no way to express — see src/pages/Dashboard.tsx).

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
  { key: "dashboard", label: "Dashboard", path: "/dashboard", loads: "GET /me/merchant" },
  { key: "paymentlinks", label: "Payment Links", path: "/payment-links", loads: "GET /me/payment-links" },
  { key: "transactions", label: "Transactions", path: "/transactions", loads: "GET /me/transactions" },
  { key: "payouts", label: "Payouts", path: "/payouts", loads: "GET /me/payouts" },
  { key: "onboarding", label: "Onboarding", path: "/onboarding", loads: "POST /me/merchant" },
  {
    key: "createpaymentlink",
    label: "New Payment Link",
    path: "/payment-links/new",
    loads: "POST /me/payment-links",
  },
  {
    key: "paymentlinkdetail",
    label: "Payment Link",
    path: "/payment-links/:id",
    loads: "GET /me/payment-links",
  },
  { key: "payoutconfirm", label: "Confirm Payout", path: "/payouts/confirm", loads: "POST /me/payouts" },
];

// FAIL LOUDLY at module load — see thunder-authentication's screens.example.ts
// for why this cannot be softened to a console.warn.
for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

/** The screens a caller can actually open, in rail order. */
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

/** Does this caller reach anything their scopes actually earned them? */
export function hasScopedReach(scopes: ReadonlySet<string>, signedIn: boolean): boolean {
  return reachableScreens(scopes, signedIn).some((screen) => !screen.public && screen.loads !== null);
}

/** The rail items — the four hub screens the sidebar shows, in wireframe order. */
export const RAIL_SCREENS: readonly ScreenRoute[] = SCREEN_ROUTES.filter((s) =>
  ["dashboard", "paymentlinks", "transactions", "payouts"].includes(s.key),
);

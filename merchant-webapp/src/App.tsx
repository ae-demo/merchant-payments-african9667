// Adapted from thunder-authentication's App.example.tsx pattern. The routing
// STRUCTURE below is prescribed, not styling:
//
//   NoAccess sits ABOVE the shell route and REPLACES it — a caller who
//   unlocks nothing gets no navbar and no empty sidebar.
//   Forbidden sits INSIDE the shell — the rail the caller CAN use stays.
//   /forbidden is wired into authz/client ONCE, from the router root.
//   Every gated route is wrapped in <RequireOperation>, the operation taken
//   from src/authz/screens.ts, never typed here.
//   /callback is routed OUTSIDE the provider: there is no session to read
//   until the redirect has been processed.
//
// merchant-webapp has no public screen — every flow in wireframes.dsl carries
// `role "Merchant"` — so there is nothing to route above the sign-in guard.

import { useEffect, type ReactElement } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthzProvider, Forbidden, NoAccess, RequireOperation, useAuthz, useScopes } from "./authz/gates";
import { SCREEN_ROUTES, reachableScreens, hasScopedReach } from "./authz/screens";
import { setForbiddenNavigator } from "./authz/client";
import { signIn } from "./authz/session";
import { AppShell } from "./shell/AppShell";
import { APP_NAME } from "./appName";
import { CallbackPage } from "./pages/Callback";
import { OnboardingPage } from "./pages/Onboarding";
import { DashboardPage } from "./pages/Dashboard";
import { PaymentLinksPage } from "./pages/PaymentLinks";
import { CreatePaymentLinkPage } from "./pages/CreatePaymentLink";
import { PaymentLinkDetailPage } from "./pages/PaymentLinkDetail";
import { TransactionsPage } from "./pages/Transactions";
import { PayoutsPage } from "./pages/Payouts";
import { PayoutConfirmPage } from "./pages/PayoutConfirm";
import { Box, Stack, Typography } from "@wso2/oxygen-ui";

const PAGE_BY_KEY: Record<string, ReactElement> = {
  dashboard: <DashboardPage />,
  paymentlinks: <PaymentLinksPage />,
  transactions: <TransactionsPage />,
  payouts: <PayoutsPage />,
  onboarding: <OnboardingPage />,
  createpaymentlink: <CreatePaymentLinkPage />,
  paymentlinkdetail: <PaymentLinkDetailPage />,
  payoutconfirm: <PayoutConfirmPage />,
};

export function App(): ReactElement {
  return (
    <>
      <ForbiddenWiring />
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="*"
          element={
            <AuthzProvider fallback={<Splash />}>
              <SignedIn />
            </AuthzProvider>
          }
        />
      </Routes>
    </>
  );
}

/** Hands src/authz/client.ts the route a refusal goes to, once, from the router root. */
function ForbiddenWiring(): null {
  const navigate = useNavigate();
  useEffect(() => {
    setForbiddenNavigator(() => navigate("/forbidden", { replace: true }));
  }, [navigate]);
  return null;
}

function Splash(): ReactElement {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <Stack spacing={1} alignItems="center">
        <Typography variant="h6">{APP_NAME}</Typography>
        <Typography color="text.secondary">Checking your session…</Typography>
      </Stack>
    </Box>
  );
}

function SignedIn(): ReactElement {
  const { signedIn } = useAuthz();
  const scopes = useScopes();

  // Load-time guard only: a MISSING session starts sign-in. currentUser()
  // already tried a silent renew, so a merely-expired token never lands here.
  useEffect(() => {
    if (!signedIn) void signIn();
  }, [signedIn]);

  if (!signedIn) return <Splash />;

  const reachable = reachableScreens(scopes, signedIn);

  if (!hasScopedReach(scopes, signedIn)) return <NoAccess appName={APP_NAME} />;

  const landing = (reachable.find((s) => !s.public && s.loads !== null) ?? reachable[0]).path;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={landing} replace />} />
        {SCREEN_ROUTES.map((screen) => {
          const page = PAGE_BY_KEY[screen.key];
          if (screen.loads === null) {
            return <Route key={screen.key} path={screen.path} element={page} />;
          }
          return (
            <Route key={screen.key} element={<RequireOperation op={screen.loads} screen={screen.label} />}>
              <Route path={screen.path} element={page} />
            </Route>
          );
        })}
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<Navigate to={landing} replace />} />
      </Route>
    </Routes>
  );
}

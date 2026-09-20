// ROUTING STRUCTURE — prescribed by thunder-authentication, adapted from
// App.example.tsx with admin-webapp's own screens:
//
//   NoAccess sits ABOVE the shell route and REPLACES it.
//   Forbidden sits INSIDE the shell, at /forbidden.
//   /forbidden is wired into authz/client ONCE, from the router root.
//   Every gated route is wrapped in <RequireOperation>, from SCREEN_ROUTES.
//   /callback is routed OUTSIDE the provider.
//   This app declares no public screen (every flow in wireframes.dsl carries
//   a `role` line — sign-in is via Thunder SSO for every screen), so nothing
//   is routed above the sign-in guard.

import { useEffect, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  AuthzProvider,
  Forbidden,
  NoAccess,
  RequireOperation,
  useAuthz,
  useScopes,
} from "./authz/gates";
import { reachableRailScreens, hasScopedReach, SCREEN_ROUTES } from "./authz/screens";
import { setForbiddenNavigator } from "./authz/client";
import { signIn } from "./authz/session";
import { AppShell } from "./shell/AppShell";
import { CallbackPage } from "./pages/Callback";
import { OnboardingQueuePage } from "./pages/OnboardingQueue";
import { MerchantDetailPage } from "./pages/MerchantDetail";
import { MerchantsPage } from "./pages/Merchants";
import { MerchantAccountPage } from "./pages/MerchantAccount";
import { AllTransactionsPage } from "./pages/AllTransactions";
import { DisputesQueuePage } from "./pages/DisputesQueue";
import { DisputeDetailPage } from "./pages/DisputeDetail";
import { APP_NAME } from "./appName";
import { Box, Stack, Typography } from "@wso2/oxygen-ui";

const PAGE_BY_KEY: Record<string, ReactElement> = {
  "onboarding-queue": <OnboardingQueuePage />,
  "merchant-detail": <MerchantDetailPage />,
  merchants: <MerchantsPage />,
  "merchant-account": <MerchantAccountPage />,
  "all-transactions": <AllTransactionsPage />,
  "disputes-queue": <DisputesQueuePage />,
  "dispute-detail": <DisputeDetailPage />,
};

export function App(): ReactElement {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

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

  // Load-time guard: only a MISSING session starts a sign-in. currentUser()
  // has already tried a silent renew.
  useEffect(() => {
    if (!signedIn) void signIn();
  }, [signedIn]);

  if (!signedIn) return <Splash />;

  if (!hasScopedReach(scopes, signedIn)) return <NoAccess appName={APP_NAME} />;

  const rail = reachableRailScreens(scopes, signedIn);
  const landing = (rail[0] ?? SCREEN_ROUTES[0]).path;

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
            <Route
              key={screen.key}
              element={<RequireOperation op={screen.loads} screen={screen.label} />}
            >
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

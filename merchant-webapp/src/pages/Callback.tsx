// The one registered redirect URI, for both the redirect and the silent-renew
// legs (thunder-authentication). handleCallback() dispatches on request_type
// and settles with no value — this page renders while that promise is in
// flight and then sends the browser home.
import { useEffect, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography } from "@wso2/oxygen-ui";
import { handleCallback } from "../authz/session";
import { APP_NAME } from "../appName";

export function CallbackPage(): ReactElement {
  const navigate = useNavigate();

  useEffect(() => {
    void handleCallback().then(() => navigate("/", { replace: true }));
  }, [navigate]);

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <Stack spacing={1} alignItems="center">
        <Typography variant="h6">{APP_NAME}</Typography>
        <Typography color="text.secondary">Signing you in…</Typography>
      </Stack>
    </Box>
  );
}

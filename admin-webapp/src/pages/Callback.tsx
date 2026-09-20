import { useEffect, useState, type JSX } from "react";
import { Box, Stack, Typography } from "@wso2/oxygen-ui";
import { handleCallback } from "../authz/session";

/**
 * Finishes whichever OIDC leg landed here — a real sign-in redirect, or a
 * silent renew's hidden iframe (both share the one registered redirect URI).
 * Renders nothing useful from the promise's VALUE, only from it settling: on
 * the redirect leg the app then navigates away entirely; on the silent leg
 * this iframe is torn down by the parent window before anyone reads it.
 */
export function CallbackPage(): JSX.Element {
  const [done, setDone] = useState(false);

  useEffect(() => {
    void handleCallback()
      .catch(() => undefined)
      .finally(() => {
        setDone(true);
        window.location.assign("/");
      });
  }, []);

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <Stack spacing={1} alignItems="center">
        <Typography variant="h6">Admin Console</Typography>
        <Typography color="text.secondary">
          {done ? "Signed in — redirecting…" : "Completing sign-in…"}
        </Typography>
      </Stack>
    </Box>
  );
}

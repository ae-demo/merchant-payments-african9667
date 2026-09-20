import { Box, Button, Card, CardContent, CircularProgress, PageContent, Stack, Typography } from "@wso2/oxygen-ui";
import type { JSX } from "react";
import { useNavigate, useParams } from "react-router";
import { formatAmount, usePaymentLink } from "../lib/paymentLink";

// screen PaymentDetails — "What the customer is paying for"
export default function PaymentDetailsPage(): JSX.Element {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const state = usePaymentLink(linkId);

  return (
    <PageContent maxWidth={520} centered>
      {state.status === "loading" && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {state.status === "error" && (
        <Card>
          <CardContent>
            <Typography variant="body1" color="error">
              {state.message}
            </Typography>
          </CardContent>
        </Card>
      )}

      {state.status === "ready" && state.link.status !== "open" && (
        <Card>
          <CardContent>
            <Typography variant="body1">
              {state.link.status === "paid"
                ? "This payment link has already been paid."
                : "This payment link has expired."}
            </Typography>
          </CardContent>
        </Card>
      )}

      {state.status === "ready" && state.link.status === "open" && (
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Amount due
              </Typography>
              <Typography variant="h4">{formatAmount(state.link.amount, state.link.currency)}</Typography>
              <Typography variant="caption" color="text.secondary">
                to {state.link.merchantName}
              </Typography>
            </CardContent>
          </Card>

          <Typography variant="body2">{state.link.description ?? "Payment request"}</Typography>

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button variant="contained" onClick={() => navigate(`/${linkId}/mobile-money`)}>
              Pay with Mobile Money
            </Button>
            <Button variant="outlined" onClick={() => navigate(`/${linkId}/card`)}>
              Pay with Card
            </Button>
          </Stack>
        </Stack>
      )}
    </PageContent>
  );
}

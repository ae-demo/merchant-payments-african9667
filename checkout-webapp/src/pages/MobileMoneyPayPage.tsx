import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  PageContent,
  Stack,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router";
import { paymentsApi } from "../api";
import { formatAmount, storeOutcome, usePaymentLink } from "../lib/paymentLink";

// screen MobileMoneyPay — "Pay via mobile money"
export default function MobileMoneyPayPage(): JSX.Element {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const state = usePaymentLink(linkId);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function confirmPayment(): Promise<void> {
    if (!linkId || state.status !== "ready") return;
    if (phoneNumber.trim() === "") {
      setValidationError("Enter your mobile money number.");
      return;
    }
    setValidationError(null);
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { data, error } = await paymentsApi.POST("/payment-links/{linkId}/pay", {
        params: { path: { linkId } },
        body: { method: "mobile_money", phoneNumber },
      });
      if (error || !data) {
        setSubmitError("The payment could not be submitted. Please try again.");
        return;
      }
      storeOutcome(linkId, {
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        merchantName: state.link.merchantName,
      });
      navigate(`/${linkId}/result`);
    } catch {
      setSubmitError("The payment could not be submitted. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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

      {state.status === "ready" && (
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

          <TextField
            label="Mobile money number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            error={validationError !== null}
            helperText={validationError ?? undefined}
            fullWidth
          />

          <Typography variant="body2" color="text.secondary">
            You will receive a prompt on your phone to confirm.
          </Typography>

          {submitError && (
            <Typography variant="body2" color="error">
              {submitError}
            </Typography>
          )}

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button variant="outlined" onClick={() => navigate(`/${linkId}`)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="contained" onClick={() => void confirmPayment()} disabled={submitting}>
              {submitting ? "Confirming…" : "Confirm payment"}
            </Button>
          </Stack>
        </Stack>
      )}
    </PageContent>
  );
}

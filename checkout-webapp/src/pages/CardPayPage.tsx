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

// screen CardPay — "Pay via card"
//
// payments-api's PaymentRequest takes a pre-tokenized `cardToken` for a card
// payment — this contract declares no tokenization endpoint or client SDK, so
// there is nothing to turn a PAN into a token with. The wireframe still draws
// card number/expiry/CVV inputs, so this screen collects them and sends a
// token built from the entered values. Flagged in the report as a contract
// gap, not silently reinterpreted.
export default function CardPayPage(): JSX.Element {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const state = usePaymentLink(linkId);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function payNow(): Promise<void> {
    if (!linkId || state.status !== "ready") return;
    if (cardNumber.trim() === "" || expiry.trim() === "" || cvv.trim() === "") {
      setValidationError("Enter your card number, expiry and CVV.");
      return;
    }
    setValidationError(null);
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { data, error } = await paymentsApi.POST("/payment-links/{linkId}/pay", {
        params: { path: { linkId } },
        body: { method: "card", cardToken: `${cardNumber}|${expiry}|${cvv}` },
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
            label="Card number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            error={validationError !== null}
            fullWidth
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Expiry"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              error={validationError !== null}
              fullWidth
            />
            <TextField
              label="CVV"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              error={validationError !== null}
              fullWidth
            />
          </Stack>

          {validationError && (
            <Typography variant="body2" color="error">
              {validationError}
            </Typography>
          )}

          {submitError && (
            <Typography variant="body2" color="error">
              {submitError}
            </Typography>
          )}

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button variant="outlined" onClick={() => navigate(`/${linkId}`)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="contained" onClick={() => void payNow()} disabled={submitting}>
              {submitting ? "Paying…" : "Pay now"}
            </Button>
          </Stack>
        </Stack>
      )}
    </PageContent>
  );
}

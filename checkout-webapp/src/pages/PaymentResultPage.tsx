import { Button, Card, CardContent, Chip, PageContent, Stack, Typography } from "@wso2/oxygen-ui";
import type { JSX } from "react";
import { useNavigate, useParams } from "react-router";
import { formatAmount, readOutcome } from "../lib/paymentLink";

const CHIP: Record<string, { label: string; color: "success" | "error" | "warning"; text: string }> = {
  completed: {
    label: "Payment successful",
    color: "success",
    text: "A receipt has been sent to your phone and email.",
  },
  pending: {
    label: "Payment processing",
    color: "warning",
    text: "We're confirming your payment. A receipt will be sent to your phone and email once it clears.",
  },
  failed: {
    label: "Payment failed",
    color: "error",
    text: "The payment could not be completed. No amount was charged.",
  },
  disputed: {
    label: "Payment disputed",
    color: "warning",
    text: "This payment is under dispute. You'll be notified by phone and email.",
  },
  refunded: {
    label: "Payment refunded",
    color: "warning",
    text: "This payment has been refunded.",
  },
};

// screen PaymentResult — "Payment outcome and receipt". The receipt itself is
// sent server-side by payments-api (sms-service / email-service) — this
// screen only reflects the outcome payments-api's pay call returned, per
// customer-payment.md; it builds no receipt of its own.
export default function PaymentResultPage(): JSX.Element {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const outcome = linkId ? readOutcome(linkId) : null;

  if (!outcome) {
    return (
      <PageContent maxWidth={520} centered>
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="body1">No payment result to show.</Typography>
            </CardContent>
          </Card>
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="outlined" onClick={() => navigate(`/${linkId ?? ""}`)}>
              Return to payment link
            </Button>
          </Stack>
        </Stack>
      </PageContent>
    );
  }

  const presentation = CHIP[outcome.status];

  return (
    <PageContent maxWidth={520} centered>
      <Stack spacing={3}>
        <Chip label={presentation.label} color={presentation.color} size="small" sx={{ alignSelf: "flex-start" }} />

        <Card>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Amount paid
            </Typography>
            <Typography variant="h4">{formatAmount(outcome.amount, outcome.currency)}</Typography>
            <Typography variant="caption" color="text.secondary">
              to {outcome.merchantName}
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="body2">{presentation.text}</Typography>
      </Stack>
    </PageContent>
  );
}

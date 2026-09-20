// wireframes.dsl: screen PayoutConfirm — a form-only screen (navbar, no
// sidebar). Its one operation is its submit: POST /me/payouts.
import { useEffect, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, PageContent, PageTitle, Skeleton, Stack, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { useMerchant } from "../lib/useMerchant";
import { computeBalance } from "../lib/balance";
import { formatMoney } from "../lib/format";

export function PayoutConfirmPage(): ReactElement {
  const navigate = useNavigate();
  const { merchant } = useMerchant();
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      paymentsApi.GET("/me/transactions", { params: { query: { limit: 100 } } }),
      paymentsApi.GET("/me/payouts", { params: { query: { limit: 100 } } }),
    ]).then(([tx, payouts]) => {
      const { availableBalance: balance } = computeBalance({
        transactions: tx.data?.data ?? [],
        payouts: payouts.data?.data ?? [],
      });
      setAvailableBalance(balance);
    });
  }, []);

  async function onConfirm(): Promise<void> {
    setSubmitting(true);
    setError(null);
    const { error: apiError } = await paymentsApi.POST("/me/payouts", {});
    setSubmitting(false);
    if (apiError) {
      setError(apiError.message ?? "Could not request the payout.");
      return;
    }
    navigate("/payouts");
  }

  return (
    <PageContent maxWidth={560} centered>
      <PageTitle>
        <PageTitle.Header>Request payout</PageTitle.Header>
      </PageTitle>

      <Stack spacing={3}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {availableBalance === null || !merchant ? (
          <Skeleton variant="text" width={320} height={32} />
        ) : (
          <Typography>
            {formatMoney(availableBalance, merchant.currency)} will be sent to your linked bank account.
          </Typography>
        )}

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button variant="outlined" onClick={() => navigate("/payouts")}>
            Cancel
          </Button>
          <Button variant="contained" disabled={submitting} onClick={() => void onConfirm()}>
            Confirm payout
          </Button>
        </Stack>
      </Stack>
    </PageContent>
  );
}

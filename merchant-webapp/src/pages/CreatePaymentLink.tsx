// wireframes.dsl: screen CreatePaymentLink — a form-only screen (navbar, no
// sidebar). Its one operation is its submit: POST /me/payment-links.
import { useState, type FormEvent, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, MenuItem, PageContent, PageTitle, Stack, TextField } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { useMerchant } from "../lib/useMerchant";
import type { components } from "../generated/payments-api";

type Currency = components["schemas"]["PaymentLinkInput"]["currency"];
const CURRENCIES: Currency[] = ["NGN", "KES", "GHS"];

export function CreatePaymentLinkPage(): ReactElement {
  const navigate = useNavigate();
  const { merchant } = useMerchant();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>(merchant?.currency ?? "NGN");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { data, error: apiError } = await paymentsApi.POST("/me/payment-links", {
      body: { description, amount: parsedAmount, currency },
    });
    setSubmitting(false);
    if (apiError || !data) {
      setError(apiError?.message ?? "Could not create the payment link.");
      return;
    }
    navigate(`/payment-links/${data.id}`, { state: { link: data }, replace: true });
  }

  return (
    <PageContent maxWidth={640} centered>
      <PageTitle>
        <PageTitle.Header>New payment link</PageTitle.Header>
      </PageTitle>

      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={3}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            label="Amount"
            required
            type="number"
            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <TextField select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
            {CURRENCIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button variant="outlined" onClick={() => navigate("/payment-links")}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              Create link
            </Button>
          </Stack>
        </Stack>
      </Box>
    </PageContent>
  );
}

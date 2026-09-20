// wireframes.dsl: screen Onboarding — a form-only screen (navbar, no
// sidebar). Its one operation is its submit: POST /me/merchant
// (src/authz/screens.ts). A merchant who already has a profile has nothing
// to onboard, so this page sends them straight to the dashboard instead of
// re-showing the form.
import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Divider,
  MenuItem,
  PageContent,
  PageTitle,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { useMerchant } from "../lib/useMerchant";
import type { components } from "../generated/payments-api";

type Country = components["schemas"]["MerchantInput"]["country"];

const COUNTRIES: { value: Country; label: string; currency: components["schemas"]["MerchantInput"]["currency"] }[] = [
  { value: "NG", label: "Nigeria", currency: "NGN" },
  { value: "KE", label: "Kenya", currency: "KES" },
  { value: "GH", label: "Ghana", currency: "GHS" },
];

export function OnboardingPage(): ReactElement {
  const navigate = useNavigate();
  const { merchant, loading, notFound } = useMerchant();

  const [businessName, setBusinessName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [country, setCountry] = useState<Country>("NG");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A profile already exists (whatever its status) — onboarding is a
  // one-time submission, so this screen has nothing further to do.
  useEffect(() => {
    if (!loading && merchant) navigate("/dashboard", { replace: true });
  }, [loading, merchant, navigate]);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const currency = COUNTRIES.find((c) => c.value === country)!.currency;
    const { error: apiError } = await paymentsApi.POST("/me/merchant", {
      body: {
        businessName,
        registrationNumber,
        country,
        currency,
        bankAccount: { accountName, accountNumber, bankName },
      },
    });
    setSubmitting(false);
    if (apiError) {
      setError(apiError.message ?? "Could not submit your profile for review.");
      return;
    }
    navigate("/dashboard");
  }

  if (loading || (!loading && !notFound && merchant)) {
    return (
      <PageContent maxWidth={720} centered>
        <Skeleton variant="rounded" height={200} />
      </PageContent>
    );
  }

  return (
    <PageContent maxWidth={720} centered>
      <PageTitle>
        <PageTitle.Header>Complete your business profile</PageTitle.Header>
      </PageTitle>

      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={3}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Business name"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
          <TextField
            label="Registration number"
            required
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
          />
          <TextField
            select
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value as Country)}
          >
            {COUNTRIES.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>

          <Divider />
          <Typography variant="h6">Bank account</Typography>

          <TextField
            label="Account name"
            required
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
          <TextField
            label="Account number"
            required
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
          <TextField label="Bank name" required value={bankName} onChange={(e) => setBankName(e.target.value)} />

          <Stack direction="row" justifyContent="flex-end">
            <Button type="submit" variant="contained" disabled={submitting}>
              Submit for review
            </Button>
          </Stack>
        </Stack>
      </Box>
    </PageContent>
  );
}

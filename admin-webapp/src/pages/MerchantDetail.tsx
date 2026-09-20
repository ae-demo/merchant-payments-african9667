import { useEffect, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PageContent,
  PageTitle,
  Chip,
  Typography,
  Divider,
  Stack,
  Button,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { Can } from "../authz/gates";
import type { components } from "../generated/payments-api";

type Merchant = components["schemas"]["Merchant"];

const COUNTRY_NAME: Record<string, string> = { NG: "Nigeria", KE: "Kenya", GH: "Ghana" };

const STATUS_COLOR: Record<Merchant["status"], "warning" | "success" | "error" | "default"> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
  suspended: "error",
};

export function MerchantDetailPage(): JSX.Element {
  const { merchantId } = useParams<{ merchantId: string }>();
  const navigate = useNavigate();
  // undefined: still loading. null: loaded, and no such merchant (404).
  const [merchant, setMerchant] = useState<Merchant | null | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!merchantId) return;
    let live = true;
    void paymentsApi
      .GET("/merchants/{merchantId}", { params: { path: { merchantId } } })
      .then(({ data }) => {
        if (live) setMerchant(data ?? null);
      })
      .catch(() => {
        if (live) setMerchant(null);
      });
    return () => {
      live = false;
    };
  }, [merchantId]);

  async function review(decision: "approved" | "rejected"): Promise<void> {
    if (!merchantId) return;
    setSubmitting(true);
    try {
      await paymentsApi.POST("/merchants/{merchantId}/review", {
        params: { path: { merchantId } },
        body: { decision },
      });
      navigate("/onboarding");
    } finally {
      setSubmitting(false);
    }
  }

  if (merchant === undefined) {
    return (
      <PageContent>
        <Typography color="text.secondary">Loading…</Typography>
      </PageContent>
    );
  }

  if (merchant === null) {
    return (
      <PageContent>
        <PageTitle>
          <PageTitle.Header>No such merchant</PageTitle.Header>
        </PageTitle>
        <Typography color="text.secondary">
          This merchant does not exist, or has already been removed from the queue.
        </Typography>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>{merchant.businessName}</PageTitle.Header>
      </PageTitle>

      <Chip label={statusLabel(merchant.status)} color={STATUS_COLOR[merchant.status]} size="small" sx={{ mb: 2 }} />
      <Typography>Registration number: {merchant.registrationNumber}</Typography>
      <Typography sx={{ mb: 2 }}>
        Country: {COUNTRY_NAME[merchant.country] ?? merchant.country} — Currency: {merchant.currency}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" sx={{ mb: 1 }}>
        Bank account
      </Typography>
      {merchant.bankAccount ? (
        <Typography sx={{ mb: 3 }}>
          {merchant.bankAccount.bankName} — {merchant.bankAccount.accountNumber} — {merchant.bankAccount.accountName}
        </Typography>
      ) : (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          No bank account on file.
        </Typography>
      )}

      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        <Can op="POST /merchants/{merchantId}/review">
          <Button variant="outlined" color="error" disabled={submitting} onClick={() => void review("rejected")}>
            Reject
          </Button>
          <Button variant="contained" disabled={submitting} onClick={() => void review("approved")}>
            Approve
          </Button>
        </Can>
      </Stack>
    </PageContent>
  );
}

function statusLabel(status: Merchant["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

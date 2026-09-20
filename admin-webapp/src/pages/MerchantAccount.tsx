import { useEffect, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageContent, PageTitle, Chip, Typography, Stack, Button } from "@wso2/oxygen-ui";
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

export function MerchantAccountPage(): JSX.Element {
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

  async function setSuspended(suspended: boolean): Promise<void> {
    if (!merchantId) return;
    setSubmitting(true);
    try {
      await paymentsApi.POST("/merchants/{merchantId}/suspend", {
        params: { path: { merchantId } },
        body: { suspended },
      });
      navigate("/merchants");
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
        <Typography color="text.secondary">This merchant does not exist.</Typography>
      </PageContent>
    );
  }

  const isSuspended = merchant.status === "suspended";

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>{merchant.businessName}</PageTitle.Header>
      </PageTitle>

      <Chip
        label={merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
        color={STATUS_COLOR[merchant.status]}
        size="small"
        sx={{ mb: 2 }}
      />
      <Typography sx={{ mb: 3 }}>
        Country: {COUNTRY_NAME[merchant.country] ?? merchant.country} — Currency: {merchant.currency}
      </Typography>

      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        <Can op="POST /merchants/{merchantId}/suspend">
          {isSuspended ? (
            <Button variant="contained" disabled={submitting} onClick={() => void setSuspended(false)}>
              Reactivate account
            </Button>
          ) : (
            <Button variant="outlined" color="error" disabled={submitting} onClick={() => void setSuspended(true)}>
              Suspend account
            </Button>
          )}
        </Can>
      </Stack>
    </PageContent>
  );
}

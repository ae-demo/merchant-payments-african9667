import { useEffect, useState, type JSX } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { PageContent, PageTitle, Typography, TextField, Stack, Button } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { Can } from "../authz/gates";
import type { components } from "../generated/payments-api";

type Dispute = components["schemas"]["Dispute"];
type Transaction = components["schemas"]["Transaction"];
type Merchant = components["schemas"]["Merchant"];

export interface DisputeNavState {
  dispute: Dispute;
  merchantName: string;
  currency: string;
}

export function DisputeDetailPage(): JSX.Element {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const passed = location.state as DisputeNavState | null;

  // undefined: still loading. null: loaded, and no such dispute.
  const [data, setData] = useState<DisputeNavState | null | undefined>(passed ?? undefined);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (passed || !disputeId) return;
    // Direct visit with no navigation state (a reload, a typed URL): there is
    // no "get one dispute" operation in payments-api's contract, so this
    // reconstructs the same view from the list endpoints, joined the same way
    // DisputesQueue joins them.
    let live = true;
    void Promise.all([
      paymentsApi.GET("/disputes", { params: { query: { limit: 100 } } }),
      paymentsApi.GET("/transactions", { params: { query: { limit: 100 } } }),
      paymentsApi.GET("/merchants", { params: { query: { limit: 100 } } }),
    ])
      .then(([disputesRes, transactionsRes, merchantsRes]) => {
        if (!live) return;
        const dispute = (disputesRes.data?.data ?? []).find((d) => d.id === disputeId);
        if (!dispute) {
          setData(null);
          return;
        }
        const transactionsById = new Map<string, Transaction>(
          (transactionsRes.data?.data ?? []).map((t) => [t.id, t]),
        );
        const merchantsById = new Map<string, Merchant>((merchantsRes.data?.data ?? []).map((m) => [m.id, m]));
        const transaction = transactionsById.get(dispute.transactionId);
        const merchant = transaction ? merchantsById.get(transaction.merchantId) : undefined;
        setData({
          dispute,
          merchantName: merchant?.businessName ?? "Unknown merchant",
          currency: transaction?.currency ?? "",
        });
      })
      .catch(() => {
        if (live) setData(null);
      });
    return () => {
      live = false;
    };
  }, [disputeId, passed]);

  async function resolve(outcome: "resolved-merchant" | "resolved-customer"): Promise<void> {
    if (!disputeId) return;
    setSubmitting(true);
    try {
      await paymentsApi.POST("/disputes/{disputeId}/resolve", {
        params: { path: { disputeId } },
        body: { outcome, notes: notes || undefined },
      });
      navigate("/disputes");
    } finally {
      setSubmitting(false);
    }
  }

  if (data === undefined) {
    return (
      <PageContent>
        <Typography color="text.secondary">Loading…</Typography>
      </PageContent>
    );
  }

  if (data === null) {
    return (
      <PageContent>
        <PageTitle>
          <PageTitle.Header>No such dispute</PageTitle.Header>
        </PageTitle>
        <Typography color="text.secondary">
          This dispute does not exist, or has already been resolved.
        </Typography>
      </PageContent>
    );
  }

  const { dispute, merchantName, currency } = data;

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Dispute on transaction #{dispute.transactionId}</PageTitle.Header>
      </PageTitle>

      <Typography>
        Merchant: {merchantName} — Amount: {dispute.amount.toLocaleString()} {currency}
      </Typography>
      <Typography sx={{ mb: 3 }}>Reason: {dispute.reason}</Typography>

      <TextField
        label="Resolution notes"
        multiline
        minRows={3}
        fullWidth
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        <Can op="POST /disputes/{disputeId}/resolve">
          <Button variant="outlined" color="error" disabled={submitting} onClick={() => void resolve("resolved-customer")}>
            Resolve for customer
          </Button>
          <Button variant="contained" disabled={submitting} onClick={() => void resolve("resolved-merchant")}>
            Resolve for merchant
          </Button>
        </Can>
      </Stack>
    </PageContent>
  );
}

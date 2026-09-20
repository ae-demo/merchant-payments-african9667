// wireframes.dsl: screen Dashboard — the merchant's home. Its "loads"
// operation is GET /me/merchant (src/authz/screens.ts): the status badge is
// the reason the screen exists, and a caller with no profile yet has nothing
// to show here at all, so this page is also where the Onboarding redirect
// lives (see OnboardingPage's own mirror-image check).
//
// "Available balance" / "Pending payout" have no payments-api endpoint —
// src/lib/balance.ts documents the derivation and the report notes the gap.
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Chip, Grid, ListingTable, PageContent, Skeleton, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { useMerchant } from "../lib/useMerchant";
import { computeBalance } from "../lib/balance";
import { formatDate, formatMoney, titleCase } from "../lib/format";
import type { components } from "../generated/payments-api";

type Transaction = components["schemas"]["Transaction"];
type PaymentLink = components["schemas"]["PaymentLink"];

const STATUS_COLOR: Record<Merchant["status"], "success" | "warning" | "error"> = {
  approved: "success",
  pending: "warning",
  rejected: "error",
  suspended: "error",
};

type Merchant = components["schemas"]["Merchant"];

export function DashboardPage(): ReactElement {
  const navigate = useNavigate();
  const { merchant, loading: merchantLoading, notFound } = useMerchant();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[] | null>(null);

  useEffect(() => {
    if (!merchantLoading && notFound) navigate("/onboarding", { replace: true });
  }, [merchantLoading, notFound, navigate]);

  useEffect(() => {
    void paymentsApi.GET("/me/transactions", { params: { query: { limit: 20 } } }).then(({ data }) => {
      setTransactions(data?.data ?? []);
    });
    void paymentsApi.GET("/me/payment-links", { params: { query: { limit: 100 } } }).then(({ data }) => {
      setPaymentLinks(data?.data ?? []);
    });
  }, []);

  const linkDescriptionById = useMemo(() => {
    const map = new Map<string, string>();
    for (const link of paymentLinks ?? []) map.set(link.id, link.description ?? link.id);
    return map;
  }, [paymentLinks]);

  const [payouts, setPayouts] = useState<components["schemas"]["Payout"][] | null>(null);
  useEffect(() => {
    void paymentsApi.GET("/me/payouts", { params: { query: { limit: 100 } } }).then(({ data }) => {
      setPayouts(data?.data ?? []);
    });
  }, []);

  const balance =
    transactions && payouts ? computeBalance({ transactions, payouts }) : { availableBalance: 0, pendingPayout: 0 };
  const openLinksCount = (paymentLinks ?? []).filter((l) => l.status === "open").length;
  const recentTransactions = (transactions ?? []).slice(0, 5);

  if (merchantLoading || notFound || !merchant) {
    return (
      <PageContent>
        <Skeleton variant="rounded" height={200} />
      </PageContent>
    );
  }

  return (
    <PageContent>
      {/* wireframes.dsl draws no `heading` on Dashboard — only the status
          `badge` — so the page opens with it directly rather than a
          synthesized title (implementing.md: the description is a brief,
          not page copy). */}
      <Box sx={{ mb: 3 }}>
        <Chip label={titleCase(merchant.status)} color={STATUS_COLOR[merchant.status]} />
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Available balance
              </Typography>
              <Typography variant="h4">{formatMoney(balance.availableBalance, merchant.currency)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Pending payout
              </Typography>
              <Typography variant="h4">{formatMoney(balance.pendingPayout, merchant.currency)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Open links
              </Typography>
              <Typography variant="h4">{openLinksCount}</Typography>
              <Typography variant="caption" color="text.secondary">
                awaiting payment
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Recent transactions
      </Typography>
      <ListingTable.Container>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Date</ListingTable.Cell>
              <ListingTable.Cell>Link</ListingTable.Cell>
              <ListingTable.Cell>Method</ListingTable.Cell>
              <ListingTable.Cell>Amount</ListingTable.Cell>
              <ListingTable.Cell>Status</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {recentTransactions.map((t) => (
              <ListingTable.Row key={t.id}>
                <ListingTable.Cell>{formatDate(t.createdAt)}</ListingTable.Cell>
                <ListingTable.Cell>{linkDescriptionById.get(t.paymentLinkId) ?? t.paymentLinkId}</ListingTable.Cell>
                <ListingTable.Cell>{titleCase(t.method)}</ListingTable.Cell>
                <ListingTable.Cell>{formatMoney(t.amount, t.currency)}</ListingTable.Cell>
                <ListingTable.Cell>
                  <Chip size="small" label={titleCase(t.status)} color={transactionColor(t.status)} />
                </ListingTable.Cell>
              </ListingTable.Row>
            ))}
          </ListingTable.Body>
        </ListingTable>
        {recentTransactions.length === 0 ? (
          <ListingTable.EmptyState title="No transactions yet" description="Share a payment link to get started." />
        ) : null}
      </ListingTable.Container>
    </PageContent>
  );
}

function transactionColor(status: Transaction["status"]): "success" | "warning" | "error" | "default" {
  if (status === "completed") return "success";
  if (status === "pending") return "warning";
  if (status === "disputed" || status === "failed") return "error";
  return "default";
}

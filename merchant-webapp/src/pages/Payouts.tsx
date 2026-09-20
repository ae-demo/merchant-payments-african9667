// wireframes.dsl: screen Payouts. loads GET /me/payouts.
import { useEffect, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Chip, ListingTable, PageContent, Skeleton, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { useMerchant } from "../lib/useMerchant";
import { computeBalance } from "../lib/balance";
import { formatDate, formatMoney, titleCase } from "../lib/format";
import type { components } from "../generated/payments-api";

type Payout = components["schemas"]["Payout"];

function statusColor(status: Payout["status"]): "success" | "warning" | "error" {
  if (status === "completed") return "success";
  if (status === "pending") return "warning";
  return "error";
}

export function PayoutsPage(): ReactElement {
  const navigate = useNavigate();
  const { merchant } = useMerchant();
  const [payouts, setPayouts] = useState<Payout[] | null>(null);
  const [transactions, setTransactions] = useState<{ status: string; amount: number }[] | null>(null);

  useEffect(() => {
    void paymentsApi.GET("/me/payouts", { params: { query: { limit: 100 } } }).then(({ data }) => {
      setPayouts(data?.data ?? []);
    });
    void paymentsApi.GET("/me/transactions", { params: { query: { limit: 100 } } }).then(({ data }) => {
      setTransactions(data?.data ?? []);
    });
  }, []);

  const balance =
    payouts && transactions ? computeBalance({ transactions, payouts }) : { availableBalance: 0, pendingPayout: 0 };

  return (
    <PageContent>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, gap: 2 }}>
        <Card sx={{ minWidth: 240 }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Available balance
            </Typography>
            <Typography variant="h4">
              {merchant ? formatMoney(balance.availableBalance, merchant.currency) : "—"}
            </Typography>
          </CardContent>
        </Card>
        <Button variant="contained" onClick={() => navigate("/payouts/confirm")}>
          Request payout
        </Button>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Payout history
      </Typography>

      {payouts === null ? (
        <Skeleton variant="rounded" height={240} />
      ) : (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Date</ListingTable.Cell>
                <ListingTable.Cell>Type</ListingTable.Cell>
                <ListingTable.Cell>Amount</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {payouts.map((p) => (
                <ListingTable.Row key={p.id}>
                  <ListingTable.Cell>{formatDate(p.completedAt ?? p.scheduledAt)}</ListingTable.Cell>
                  <ListingTable.Cell>{titleCase(p.type)}</ListingTable.Cell>
                  <ListingTable.Cell>{formatMoney(p.amount, p.currency)}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip size="small" label={titleCase(p.status)} color={statusColor(p.status)} />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))}
            </ListingTable.Body>
          </ListingTable>
          {payouts.length === 0 ? (
            <ListingTable.EmptyState title="No payouts yet" description="Your payout history will appear here." />
          ) : null}
        </ListingTable.Container>
      )}
    </PageContent>
  );
}

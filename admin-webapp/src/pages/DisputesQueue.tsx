import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { PageContent, PageTitle, ListingTable, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";
import type { DisputeNavState } from "./DisputeDetail";

type Dispute = components["schemas"]["Dispute"];
type Transaction = components["schemas"]["Transaction"];
type Merchant = components["schemas"]["Merchant"];

function formatDate(iso: string): string {
  const days = Math.floor(
    (new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000),
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString();
}

interface Row {
  dispute: Dispute;
  merchantName: string;
  currency: string;
  transactionId: string;
}

export function DisputesQueuePage(): JSX.Element {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let live = true;
    void Promise.all([
      paymentsApi.GET("/disputes", { params: { query: { status: "open", limit: 100 } } }),
      paymentsApi.GET("/transactions", { params: { query: { limit: 100 } } }),
      paymentsApi.GET("/merchants", { params: { query: { limit: 100 } } }),
    ]).then(([disputesRes, transactionsRes, merchantsRes]) => {
      if (!live) return;
      const transactionsById = new Map<string, Transaction>(
        (transactionsRes.data?.data ?? []).map((t) => [t.id, t]),
      );
      const merchantsById = new Map<string, Merchant>((merchantsRes.data?.data ?? []).map((m) => [m.id, m]));
      const built: Row[] = (disputesRes.data?.data ?? []).map((dispute) => {
        const transaction = transactionsById.get(dispute.transactionId);
        const merchant = transaction ? merchantsById.get(transaction.merchantId) : undefined;
        return {
          dispute,
          merchantName: merchant?.businessName ?? "Unknown merchant",
          currency: transaction?.currency ?? "",
          transactionId: dispute.transactionId,
        };
      });
      setRows(built);
    });
    return () => {
      live = false;
    };
  }, []);

  function openDispute(row: Row): void {
    const state: DisputeNavState = {
      dispute: row.dispute,
      merchantName: row.merchantName,
      currency: row.currency,
    };
    navigate(`/disputes/${row.dispute.id}`, { state });
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Open disputes</PageTitle.Header>
        <PageTitle.SubHeader>Disputed transactions awaiting resolution</PageTitle.SubHeader>
      </PageTitle>

      <ListingTable.Container>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Merchant</ListingTable.Cell>
              <ListingTable.Cell>Amount</ListingTable.Cell>
              <ListingTable.Cell>Reason</ListingTable.Cell>
              <ListingTable.Cell>Raised</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {(rows ?? []).map((row) => (
              <ListingTable.Row key={row.dispute.id} clickable onClick={() => openDispute(row)}>
                <ListingTable.Cell>{row.merchantName}</ListingTable.Cell>
                <ListingTable.Cell>
                  {row.dispute.amount.toLocaleString()} {row.currency}
                </ListingTable.Cell>
                <ListingTable.Cell>{row.dispute.reason}</ListingTable.Cell>
                <ListingTable.Cell>{formatDate(row.dispute.createdAt)}</ListingTable.Cell>
              </ListingTable.Row>
            ))}
          </ListingTable.Body>
        </ListingTable>
        {rows !== null && rows.length === 0 ? (
          <ListingTable.EmptyState title="No open disputes" description="Every dispute has been resolved." />
        ) : null}
      </ListingTable.Container>
      {rows === null ? <Typography color="text.secondary">Loading…</Typography> : null}
    </PageContent>
  );
}

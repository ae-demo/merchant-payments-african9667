import { useEffect, useMemo, useState, type JSX } from "react";
import { PageContent, PageTitle, ListingTable, Chip, MenuItem, TextField, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type Transaction = components["schemas"]["Transaction"];

const STATUS_COLOR: Record<Transaction["status"], "warning" | "success" | "error" | "default" | "info"> = {
  pending: "warning",
  completed: "success",
  failed: "error",
  disputed: "warning",
  refunded: "info",
};
const STATUS_OPTIONS: Array<Transaction["status"]> = ["pending", "completed", "failed", "disputed", "refunded"];
const METHOD_LABEL: Record<Transaction["method"], string> = {
  mobile_money: "Mobile Money",
  card: "Card",
};

function formatDate(iso: string): string {
  const days = Math.floor(
    (new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000),
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString();
}

export function AllTransactionsPage(): JSX.Element {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [merchantNames, setMerchantNames] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string>("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    // Every merchant, once — joined below on merchantId, since Transaction
    // carries no business name of its own (only one request, per the wireframe
    // table's "Merchant" column).
    void paymentsApi.GET("/merchants", { params: { query: { limit: 100 } } }).then(({ data }) => {
      const byId: Record<string, string> = {};
      for (const merchant of data?.data ?? []) byId[merchant.id] = merchant.businessName;
      setMerchantNames(byId);
    });
  }, []);

  useEffect(() => {
    let live = true;
    void paymentsApi
      .GET("/transactions", {
        params: { query: { limit: 100, ...(status ? { status: status as Transaction["status"] } : {}) } },
      })
      .then(({ data }) => {
        if (live) setTransactions(data?.data ?? []);
      });
    return () => {
      live = false;
    };
  }, [status]);

  const filtered = useMemo(() => {
    const rows = transactions ?? [];
    if (!query.trim()) return rows;
    const needle = query.trim().toLowerCase();
    return rows.filter((t) => {
      const merchantName = merchantNames[t.merchantId] ?? "";
      return (
        merchantName.toLowerCase().includes(needle) ||
        (t.providerReference ?? "").toLowerCase().includes(needle)
      );
    });
  }, [transactions, merchantNames, query]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Transactions</PageTitle.Header>
        <PageTitle.SubHeader>Transactions across every merchant</PageTitle.SubHeader>
      </PageTitle>

      <ListingTable.Container>
        <ListingTable.Toolbar
          showSearch
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search by merchant or reference"
          actions={
            <TextField
              select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              size="small"
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All</MenuItem>
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          }
        />
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Merchant</ListingTable.Cell>
              <ListingTable.Cell>Method</ListingTable.Cell>
              <ListingTable.Cell>Amount</ListingTable.Cell>
              <ListingTable.Cell>Status</ListingTable.Cell>
              <ListingTable.Cell>Date</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {filtered.map((tx) => (
              <ListingTable.Row key={tx.id}>
                <ListingTable.Cell>{merchantNames[tx.merchantId] ?? tx.merchantId}</ListingTable.Cell>
                <ListingTable.Cell>{METHOD_LABEL[tx.method]}</ListingTable.Cell>
                <ListingTable.Cell>
                  {tx.amount.toLocaleString()} {tx.currency}
                </ListingTable.Cell>
                <ListingTable.Cell>
                  <Chip
                    label={tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    color={STATUS_COLOR[tx.status]}
                    size="small"
                  />
                </ListingTable.Cell>
                <ListingTable.Cell>{formatDate(tx.createdAt)}</ListingTable.Cell>
              </ListingTable.Row>
            ))}
          </ListingTable.Body>
        </ListingTable>
        {transactions !== null && filtered.length === 0 ? (
          <ListingTable.EmptyState title="No transactions" description="No transaction matches this filter." />
        ) : null}
      </ListingTable.Container>
      {transactions === null ? <Typography color="text.secondary">Loading…</Typography> : null}
    </PageContent>
  );
}

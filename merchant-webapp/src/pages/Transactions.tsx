// wireframes.dsl: screen Transactions. loads GET /me/transactions.
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Chip, ListingTable, MenuItem, PageContent, PageTitle, SearchBar, Skeleton, TextField } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import { formatDate, formatMoney, titleCase } from "../lib/format";
import type { components } from "../generated/payments-api";

type Transaction = components["schemas"]["Transaction"];
type PaymentLink = components["schemas"]["PaymentLink"];
type Status = Transaction["status"];

const STATUSES: Status[] = ["pending", "completed", "failed", "disputed", "refunded"];

function statusColor(status: Status): "success" | "warning" | "error" | "default" {
  if (status === "completed") return "success";
  if (status === "pending") return "warning";
  if (status === "disputed" || status === "failed") return "error";
  return "default";
}

export function TransactionsPage(): ReactElement {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status | "">("");

  useEffect(() => {
    void paymentsApi.GET("/me/payment-links", { params: { query: { limit: 100 } } }).then(({ data }) => {
      setPaymentLinks(data?.data ?? []);
    });
  }, []);

  useEffect(() => {
    setTransactions(null);
    void paymentsApi
      .GET("/me/transactions", { params: { query: { limit: 100, ...(status ? { status } : {}) } } })
      .then(({ data }) => setTransactions(data?.data ?? []));
  }, [status]);

  const linkDescriptionById = useMemo(() => {
    const map = new Map<string, string>();
    for (const link of paymentLinks) map.set(link.id, link.description ?? link.id);
    return map;
  }, [paymentLinks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !transactions) return transactions ?? [];
    return transactions.filter((t) => {
      const link = (linkDescriptionById.get(t.paymentLinkId) ?? "").toLowerCase();
      const reference = (t.providerReference ?? "").toLowerCase();
      return link.includes(q) || reference.includes(q);
    });
  }, [transactions, search, linkDescriptionById]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Transactions</PageTitle.Header>
        <PageTitle.Actions>
          <SearchBar
            placeholder="Search by link or reference"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
          />
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status | "")}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            {STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {titleCase(s)}
              </MenuItem>
            ))}
          </TextField>
        </PageTitle.Actions>
      </PageTitle>

      {transactions === null ? (
        <Skeleton variant="rounded" height={240} />
      ) : (
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
              {filtered.map((t) => (
                <ListingTable.Row key={t.id}>
                  <ListingTable.Cell>{formatDate(t.createdAt)}</ListingTable.Cell>
                  <ListingTable.Cell>{linkDescriptionById.get(t.paymentLinkId) ?? t.paymentLinkId}</ListingTable.Cell>
                  <ListingTable.Cell>{titleCase(t.method)}</ListingTable.Cell>
                  <ListingTable.Cell>{formatMoney(t.amount, t.currency)}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip size="small" label={titleCase(t.status)} color={statusColor(t.status)} />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))}
            </ListingTable.Body>
          </ListingTable>
          {filtered.length === 0 ? (
            <ListingTable.EmptyState title="No transactions found" description="Try a different search or filter." />
          ) : null}
        </ListingTable.Container>
      )}
    </PageContent>
  );
}

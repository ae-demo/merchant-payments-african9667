import { useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { PageContent, PageTitle, ListingTable, Chip, MenuItem, TextField, Typography } from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type Merchant = components["schemas"]["Merchant"];

const COUNTRY_NAME: Record<string, string> = { NG: "Nigeria", KE: "Kenya", GH: "Ghana" };
const STATUS_COLOR: Record<Merchant["status"], "warning" | "success" | "error" | "default"> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
  suspended: "error",
};
const STATUS_OPTIONS: Array<Merchant["status"]> = ["pending", "approved", "rejected", "suspended"];

export function MerchantsPage(): JSX.Element {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<Merchant[] | null>(null);
  const [status, setStatus] = useState<string>("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let live = true;
    void paymentsApi
      .GET("/merchants", {
        params: { query: { limit: 100, ...(status ? { status: status as Merchant["status"] } : {}) } },
      })
      .then(({ data }) => {
        if (live) setMerchants(data?.data ?? []);
      });
    return () => {
      live = false;
    };
  }, [status]);

  const filtered = useMemo(() => {
    const rows = merchants ?? [];
    if (!query.trim()) return rows;
    const needle = query.trim().toLowerCase();
    return rows.filter((m) => m.businessName.toLowerCase().includes(needle));
  }, [merchants, query]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Merchants</PageTitle.Header>
        <PageTitle.SubHeader>Every merchant on the platform</PageTitle.SubHeader>
      </PageTitle>

      <ListingTable.Container>
        <ListingTable.Toolbar
          showSearch
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search by business name"
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
              <ListingTable.Cell>Business</ListingTable.Cell>
              <ListingTable.Cell>Country</ListingTable.Cell>
              <ListingTable.Cell>Status</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {filtered.map((merchant) => (
              <ListingTable.Row
                key={merchant.id}
                clickable
                onClick={() => navigate(`/merchants/${merchant.id}`)}
              >
                <ListingTable.Cell>{merchant.businessName}</ListingTable.Cell>
                <ListingTable.Cell>{COUNTRY_NAME[merchant.country] ?? merchant.country}</ListingTable.Cell>
                <ListingTable.Cell>
                  <Chip
                    label={merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
                    color={STATUS_COLOR[merchant.status]}
                    size="small"
                  />
                </ListingTable.Cell>
              </ListingTable.Row>
            ))}
          </ListingTable.Body>
        </ListingTable>
        {merchants !== null && filtered.length === 0 ? (
          <ListingTable.EmptyState title="No merchants" description="No merchant matches this filter." />
        ) : null}
      </ListingTable.Container>
      {merchants === null ? <Typography color="text.secondary">Loading…</Typography> : null}
    </PageContent>
  );
}

import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageContent,
  PageTitle,
  ListingTable,
  Typography,
} from "@wso2/oxygen-ui";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

type Merchant = components["schemas"]["Merchant"];

const COUNTRY_NAME: Record<string, string> = { NG: "Nigeria", KE: "Kenya", GH: "Ghana" };

function formatSubmitted(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const days = Math.floor((today.setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / oneDay);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString();
}

export function OnboardingQueuePage(): JSX.Element {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<Merchant[] | null>(null);

  useEffect(() => {
    let live = true;
    void paymentsApi
      .GET("/merchants", { params: { query: { status: "pending", limit: 100 } } })
      .then(({ data }) => {
        if (live) setMerchants(data?.data ?? []);
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Pending merchants</PageTitle.Header>
        <PageTitle.SubHeader>Merchant applications awaiting review</PageTitle.SubHeader>
      </PageTitle>

      <ListingTable.Container>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Business</ListingTable.Cell>
              <ListingTable.Cell>Country</ListingTable.Cell>
              <ListingTable.Cell>Submitted</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {(merchants ?? []).map((merchant) => (
              <ListingTable.Row
                key={merchant.id}
                clickable
                onClick={() => navigate(`/onboarding/${merchant.id}`)}
              >
                <ListingTable.Cell>{merchant.businessName}</ListingTable.Cell>
                <ListingTable.Cell>{COUNTRY_NAME[merchant.country] ?? merchant.country}</ListingTable.Cell>
                <ListingTable.Cell>
                  {merchant.createdAt ? formatSubmitted(merchant.createdAt) : "—"}
                </ListingTable.Cell>
              </ListingTable.Row>
            ))}
          </ListingTable.Body>
        </ListingTable>
        {merchants !== null && merchants.length === 0 ? (
          <ListingTable.EmptyState
            title="No pending merchants"
            description="Every submission has been reviewed."
          />
        ) : null}
      </ListingTable.Container>
      {merchants === null ? <Typography color="text.secondary">Loading…</Typography> : null}
    </PageContent>
  );
}

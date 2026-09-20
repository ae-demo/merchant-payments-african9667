// wireframes.dsl: screen PaymentLinks. loads GET /me/payment-links.
import { useEffect, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Chip, ListingTable, PageContent, PageTitle, Skeleton } from "@wso2/oxygen-ui";
import { Plus } from "@wso2/oxygen-ui-icons-react";
import { paymentsApi } from "../api";
import { formatDate, formatMoney, titleCase } from "../lib/format";
import type { components } from "../generated/payments-api";

type PaymentLink = components["schemas"]["PaymentLink"];

const STATUS_COLOR: Record<PaymentLink["status"], "info" | "success" | "default"> = {
  open: "info",
  paid: "success",
  expired: "default",
};

export function PaymentLinksPage(): ReactElement {
  const navigate = useNavigate();
  const [links, setLinks] = useState<PaymentLink[] | null>(null);

  useEffect(() => {
    void paymentsApi.GET("/me/payment-links", { params: { query: { limit: 100 } } }).then(({ data }) => {
      setLinks(data?.data ?? []);
    });
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Payment links</PageTitle.Header>
        <PageTitle.Actions>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => navigate("/payment-links/new")}>
            New payment link
          </Button>
        </PageTitle.Actions>
      </PageTitle>

      {links === null ? (
        <Skeleton variant="rounded" height={240} />
      ) : (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Description</ListingTable.Cell>
                <ListingTable.Cell>Amount</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell>Created</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {links.map((link) => (
                <ListingTable.Row
                  key={link.id}
                  clickable
                  onClick={() => navigate(`/payment-links/${link.id}`, { state: { link } })}
                >
                  <ListingTable.Cell>{link.description ?? "—"}</ListingTable.Cell>
                  <ListingTable.Cell>{formatMoney(link.amount, link.currency)}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip size="small" label={titleCase(link.status)} color={STATUS_COLOR[link.status]} />
                  </ListingTable.Cell>
                  <ListingTable.Cell>{formatDate(link.createdAt)}</ListingTable.Cell>
                </ListingTable.Row>
              ))}
            </ListingTable.Body>
          </ListingTable>
          {links.length === 0 ? (
            <ListingTable.EmptyState
              title="No payment links yet"
              description="Create one to start collecting a payment."
            />
          ) : null}
        </ListingTable.Container>
      )}
    </PageContent>
  );
}

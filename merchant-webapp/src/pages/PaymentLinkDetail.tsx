// wireframes.dsl: screen PaymentLinkDetail — a form-only... no, a detail
// screen (navbar, no sidebar). payments-api has no GET /me/payment-links/{id}
// (only the list and the public, unauthenticated GET /payment-links/{id}),
// so this screen reuses the list operation (src/authz/screens.ts loads
// GET /me/payment-links): the link arrives via navigation state when reached
// from PaymentLinks or CreatePaymentLink, and falls back to one list call
// (filtered by id) for a direct/typed visit.
//
// The wireframe's own link text ("https://pay.example.com/l/abc123") is
// placeholder copy — payments-api's PaymentLink schema carries no shareable
// URL field — so this page composes the same shape with the real id.
import { useEffect, useState, type ReactElement } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, PageContent, PageTitle, Skeleton, Stack, Typography } from "@wso2/oxygen-ui";
import { Copy } from "@wso2/oxygen-ui-icons-react";
import { paymentsApi } from "../api";
import { formatMoney } from "../lib/format";
import type { components } from "../generated/payments-api";

type PaymentLink = components["schemas"]["PaymentLink"];

const STATUS_COLOR: Record<PaymentLink["status"], "info" | "success" | "default"> = {
  open: "info",
  paid: "success",
  expired: "default",
};

export function PaymentLinkDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const stateLink = (location.state as { link?: PaymentLink } | null)?.link;

  const [link, setLink] = useState<PaymentLink | null>(stateLink ?? null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (stateLink || !id) return;
    void paymentsApi.GET("/me/payment-links", { params: { query: { limit: 100 } } }).then(({ data }) => {
      const found = data?.data.find((l) => l.id === id);
      if (found) setLink(found);
      else setNotFound(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (notFound) {
    return (
      <PageContent maxWidth={640} centered>
        <Alert severity="error">No such payment link.</Alert>
        <Box sx={{ mt: 2 }}>
          <Button onClick={() => navigate("/payment-links")}>Back to payment links</Button>
        </Box>
      </PageContent>
    );
  }

  if (!link) {
    return (
      <PageContent maxWidth={640} centered>
        <Skeleton variant="rounded" height={160} />
      </PageContent>
    );
  }

  const shareUrl = `https://pay.example.com/l/${link.id}`;

  return (
    <PageContent maxWidth={640} centered>
      <PageTitle>
        <PageTitle.Header>{link.description ?? link.id}</PageTitle.Header>
      </PageTitle>

      <Stack spacing={2}>
        <Box>
          <Chip label={link.status.charAt(0).toUpperCase() + link.status.slice(1)} color={STATUS_COLOR[link.status]} />
        </Box>
        <Typography>
          Amount: {formatMoney(link.amount, link.currency)}
        </Typography>
        <Typography sx={{ wordBreak: "break-all" }} color="text.secondary">
          {shareUrl}
        </Typography>

        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={<Copy size={18} />}
            onClick={() => {
              void navigator.clipboard?.writeText(shareUrl);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </Button>
        </Stack>
      </Stack>
    </PageContent>
  );
}

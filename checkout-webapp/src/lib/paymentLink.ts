import { useEffect, useState } from "react";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

export type PaymentLinkPublic = components["schemas"]["PaymentLinkPublic"];

export type PaymentLinkState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; link: PaymentLinkPublic };

/**
 * The payment link a customer landed on, fetched from payments-api's public
 * `GET /payment-links/{linkId}` — the one call every checkout screen needs to
 * show the amount and merchant. Every screen fetches it independently (rather
 * than trusting router state) so a screen loaded fresh — a bookmark, a shared
 * link, F5 — always shows real data.
 */
export function usePaymentLink(linkId: string | undefined): PaymentLinkState {
  const [state, setState] = useState<PaymentLinkState>({ status: "loading" });

  useEffect(() => {
    if (!linkId) {
      setState({ status: "error", message: "No payment link was given." });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    paymentsApi
      .GET("/payment-links/{linkId}", { params: { path: { linkId } } })
      .then(({ data, error, response }) => {
        if (cancelled) return;
        if (error || !data) {
          setState({
            status: "error",
            message:
              response.status === 404
                ? "This payment link is invalid or has expired."
                : "Something went wrong loading this payment link. Please try again.",
          });
          return;
        }
        setState({ status: "ready", link: data });
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Something went wrong loading this payment link. Please try again.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [linkId]);

  return state;
}

export function formatAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString()} ${currency}`;
}

const RESULT_KEY_PREFIX = "checkout-webapp:result:";

export interface PaymentOutcome {
  status: "pending" | "completed" | "failed" | "disputed" | "refunded";
  amount: number;
  currency: string;
  merchantName: string;
}

/** Survives a reload of the result screen — sessionStorage is the page's own
 * state, not the mock service worker's, so it persists exactly as it would in
 * production. */
export function storeOutcome(linkId: string, outcome: PaymentOutcome): void {
  sessionStorage.setItem(RESULT_KEY_PREFIX + linkId, JSON.stringify(outcome));
}

export function readOutcome(linkId: string): PaymentOutcome | null {
  const raw = sessionStorage.getItem(RESULT_KEY_PREFIX + linkId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PaymentOutcome;
  } catch {
    return null;
  }
}

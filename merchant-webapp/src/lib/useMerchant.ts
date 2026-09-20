// The caller's own merchant profile (GET /me/merchant), shared by Dashboard
// and Onboarding: both need to know whether a profile exists yet, and
// Dashboard also needs it for the status badge.
import { useCallback, useEffect, useState } from "react";
import { paymentsApi } from "../api";
import type { components } from "../generated/payments-api";

export type Merchant = components["schemas"]["Merchant"];

export interface MerchantState {
  readonly merchant: Merchant | null;
  readonly loading: boolean;
  readonly notFound: boolean;
  readonly error: string | null;
  readonly refetch: () => void;
}

export function useMerchant(): MerchantState {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    void paymentsApi.GET("/me/merchant").then(({ data, response }) => {
      if (!live) return;
      if (response.status === 404) {
        setNotFound(true);
        setMerchant(null);
      } else if (data) {
        setNotFound(false);
        setMerchant(data);
      } else {
        setError("Could not load your merchant profile.");
      }
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [tick]);

  return { merchant, loading, notFound, error, refetch };
}

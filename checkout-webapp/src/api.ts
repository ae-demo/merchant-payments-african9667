import createClient from "openapi-fetch";
import type { paths } from "./generated/payments-api";

// Same-origin: nginx proxies /api to the payments-api sibling and strips the
// prefix (react-webapp: "Same-origin API proxy"). This app calls only the two
// public, unauthenticated operations of payments-api's contract:
//   GET  /payment-links/{linkId}
//   POST /payment-links/{linkId}/pay
export const paymentsApi = createClient<paths>({ baseUrl: "/api" });

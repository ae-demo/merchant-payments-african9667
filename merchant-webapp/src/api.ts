// The payments-api client: openapi-fetch, typed against src/generated/,
// same-origin baseUrl. nginx (nginx/15-aep-api-proxy.sh) proxies /api to the
// sibling's gateway address.
//
// Authorization is NOT this file's job. It attaches the bearer and applies
// the 401 rule through src/authz/client.ts's middleware hooks
// (authorizationHeader / classifyResponse) exactly as that module's own
// doc comment shows — this client adds nothing of its own about
// authorization.

import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./generated/payments-api";
import { authorizationHeader, classifyResponse, ForbiddenError } from "./authz/client";

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const header = await authorizationHeader();
    if (header) request.headers.set("Authorization", header);
    return request;
  },
  async onResponse({ response }) {
    if ((await classifyResponse(response.status)) === "forbidden") {
      throw new ForbiddenError(response.status);
    }
    return response;
  },
};

export const paymentsApi = createClient<paths>({ baseUrl: "/api" });
paymentsApi.use(authMiddleware);

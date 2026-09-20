// window._env_ for `npm run dev:mock` — exactly the keys src/env.ts declares
// (react-webapp's mock-mode.md §4). No sibling API URL: payments-api is
// same-origin /api, served here by MSW (handlers.ts) instead of nginx.
export const mockEnv = {
  THUNDER_AUTH_CLIENT_ID: "mock-client",
  THUNDER_AUTH_ISSUER: "https://mock-idp.test",
  // The OIDC scopes are `group` and `ou`, singular, exactly as the platform
  // requests them; the project's own catalog handles follow. Kept in sync
  // with security.json's Merchant role grants by mock/authz/roles.gen.ts,
  // which mock/authz/session.ts reads to build the actual token scope string
  // — this string is never read for scope decisions, only declared here so
  // src/env.ts finds every key it expects.
  THUNDER_AUTH_SCOPES:
    "openid profile email group ou merchants:read merchants:update payment-links:create payment-links:read transactions:read payouts:read payouts:request",
  THUNDER_AUTH_RESOURCE: "https://mock-idp.test/resources/mock-project",
};

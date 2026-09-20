// Mock mode's window._env_. Exactly the keys src/env.ts declares — this app's
// thunder-auth OIDC keys — and nothing else. No sibling API address: the app
// reaches payments-api at same-origin /api, which mock/handlers.ts answers.
export const mockEnv = {
  THUNDER_AUTH_CLIENT_ID: "mock-client",
  THUNDER_AUTH_ISSUER: "https://mock-idp.test",
  // No THUNDER_AUTH_JWKS_URL: the platform emits it, src/env.ts does not
  // declare it (the browser never validates a token), so mock mode does not
  // carry it either.
  THUNDER_AUTH_SCOPES:
    "openid profile email group ou merchants:read-all merchants:review merchants:suspend transactions:read-all disputes:read-all disputes:resolve",
  THUNDER_AUTH_RESOURCE: "https://mock-idp.test/resources/mock-project",
};

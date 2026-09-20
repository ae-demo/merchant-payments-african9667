// Typed read of window._env_, the platform's runtime config. The platform
// mounts /env-config.js into the served root before the bundle runs; this
// module throws if that never happened, rather than silently defaulting a
// missing key (a silent fallback hides a missing OIDC issuer).
//
// Only the keys this app actually reads are declared:
//   - THUNDER_AUTH_* — the auth platform-resource dependency's OIDC config.
//     THUNDER_AUTH_JWKS_URL is emitted by the platform but NOT declared here:
//     the browser never validates a token (the API gateway does), so no asset
//     in this app reads it.
// There is no sibling API URL here: payments-api is reached same-origin at
// /api, proxied by nginx (see nginx/15-aep-api-proxy.sh).

type Env = {
  THUNDER_AUTH_CLIENT_ID: string;
  THUNDER_AUTH_ISSUER: string;
  THUNDER_AUTH_SCOPES: string;
  THUNDER_AUTH_RESOURCE: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;

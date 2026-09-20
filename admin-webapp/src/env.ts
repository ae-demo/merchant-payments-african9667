type Env = {
  // thunder-auth (platform-resource, kind thunder-app). All four, and RESOURCE
  // is not optional: without it the token's `aud` is wrong and every /api call
  // 401s while sign-in looks healthy. The dependency also emits
  // THUNDER_AUTH_JWKS_URL; it is NOT here, because the browser never validates
  // a token — the API gateway does — so no asset reads it.
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

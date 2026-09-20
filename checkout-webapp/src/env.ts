// This app has no auth dependency, no `configurations.env` defaults, and its
// only dependency (payments-api) is a same-origin `/api` sibling — never a
// `window._env_` key (react-webapp: "Constraints"). So there is nothing this
// app reads out of `window._env_` today; the type stays empty on purpose
// rather than declaring a key nothing emits.
type Env = Record<string, never>;

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

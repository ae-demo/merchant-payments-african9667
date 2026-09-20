// This app has no auth dependency, no `configurations.env` defaults, and its
// one dependency (payments-api) is a same-origin `/api` sibling — never a
// `window._env_` key. `src/env.ts` declares no keys, so the mock carries none.
export const mockEnv = {};

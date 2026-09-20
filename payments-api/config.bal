// Single place every other module reads platform-injected configuration through.
// Names come straight from design.json's `wiring.envBindings` — never renamed,
// never invented — so the platform's injected values arrive where this file
// expects them.

import ballerina/os;

// payments-db (platform-resource, postgres-cnpg)
configurable string paymentsDbHost = os:getEnv("PAYMENTS_DB_HOST");
configurable string paymentsDbPort = os:getEnv("PAYMENTS_DB_PORT");
configurable string paymentsDbName = os:getEnv("PAYMENTS_DB_DBNAME");
configurable string paymentsDbUser = os:getEnv("PAYMENTS_DB_USER");
configurable string paymentsDbPassword = os:getEnv("PAYMENTS_DB_PASSWORD");

// internal-payments-api (external — charges, refunds, payment/payout status)
configurable string paymentApiBaseUrl = os:getEnv("PAYMENT_API_BASE_URL");

// sms-service (external — payment receipts, merchant notices)
configurable string smsServiceUrl = os:getEnv("SMS_SERVICE_URL");

// email-service (external — onboarding decisions, payout notices, dispute outcomes)
configurable string emailServiceBaseUrl = os:getEnv("EMAIL_SERVICE_BASE_URL");

// thunder-auth (platform-resource, thunder-app). This service authenticates the
// caller from the gateway's own signed assertion (GATEWAY_ASSERTION_* below),
// never from these — they exist so workload.yaml's resource wiring is complete,
// the same way the SPA callers of this API read them for sign-in.
configurable string thunderAuthClientId = os:getEnv("THUNDER_AUTH_CLIENT_ID");
configurable string thunderAuthIssuer = os:getEnv("THUNDER_AUTH_ISSUER");
configurable string thunderAuthJwksUrl = os:getEnv("THUNDER_AUTH_JWKS_URL");
configurable string thunderAuthResource = os:getEnv("THUNDER_AUTH_RESOURCE");
configurable string thunderAuthScopes = os:getEnv("THUNDER_AUTH_SCOPES");

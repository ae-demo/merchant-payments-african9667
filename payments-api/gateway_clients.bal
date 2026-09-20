// One client per external dependency, built from the injected base URL —
// never a hardcoded host.
//
// Lazy, not eager: a `final ... = check new(...)` at module level (this
// file's first cut) connects the moment the module loads — before the HTTP
// listener ever opens — so an empty, not-yet-configured base URL (these are
// `external` dependencies, provisioned separately from this service) fails
// module initialization and the WHOLE SERVICE never starts: no listener, no
// health check, nothing. Every request then 504s at the gateway forever,
// which is indistinguishable from the service being down — because it is.
// MEASURED: `check new("")` fails immediately with "malformed URL", and a
// top-level `check` failing anywhere aborts the module before `main` (or the
// listener) ever runs. `db.bal`'s `getDb()` already documents and avoids this
// exact trap for Postgres; the same pattern applies here.

import payments_api.email_service;
import payments_api.internal_payments;
import payments_api.sms_service;

internal_payments:Client? livePaymentGatewayClient = ();
sms_service:Client? liveSmsClient = ();
email_service:Client? liveEmailClient = ();

function getPaymentGatewayClient() returns internal_payments:Client|error {
    internal_payments:Client? existing = livePaymentGatewayClient;
    if existing is internal_payments:Client {
        return existing;
    }
    internal_payments:Client newClient = check new (serviceUrl = paymentApiBaseUrl);
    livePaymentGatewayClient = newClient;
    return newClient;
}

function getSmsClient() returns sms_service:Client|error {
    sms_service:Client? existing = liveSmsClient;
    if existing is sms_service:Client {
        return existing;
    }
    sms_service:Client newClient = check new (serviceUrl = smsServiceUrl);
    liveSmsClient = newClient;
    return newClient;
}

function getEmailClient() returns email_service:Client|error {
    email_service:Client? existing = liveEmailClient;
    if existing is email_service:Client {
        return existing;
    }
    email_service:Client newClient = check new (serviceUrl = emailServiceBaseUrl);
    liveEmailClient = newClient;
    return newClient;
}

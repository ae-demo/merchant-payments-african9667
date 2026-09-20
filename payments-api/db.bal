// Postgres storage (payments-db). `getDb()` is the one place every store
// module reaches the client through — it connects and creates the schema on
// the FIRST real call, rather than at module load.
//
// Deliberately lazy, not eager: a `final postgresql:Client = check new(...)`
// at module level (this file's first cut) connects the moment the module
// loads, which happens for every `bal test` run too, including one that
// tests only the gateway-assertion verifier and touches no store function at
// all. Wrapping construction in a function — the pattern the `ballerina`
// skill's own testing guide names for exactly this ("wrap its construction in
// a small init function so a test can replace it") — means the connection
// attempt happens only when a resource handler actually needs a row, so the
// assertion tests need no Postgres reachable at all. A deployed pod still
// fails the first request fast if payments-db is unreachable; it does not
// need to fail before that.

import ballerina/log;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

postgresql:Client? liveDbClient = ();
boolean schemaReady = false;

function getDb() returns postgresql:Client|error {
    postgresql:Client? existing = liveDbClient;
    if existing is postgresql:Client {
        return existing;
    }
    postgresql:Client newClient = check new (
        host = paymentsDbHost,
        username = paymentsDbUser,
        password = paymentsDbPassword,
        database = paymentsDbName,
        port = check int:fromString(paymentsDbPort)
    );
    if !schemaReady {
        check ensureSchema(newClient);
        schemaReady = true;
    }
    liveDbClient = newClient;
    return newClient;
}

function ensureSchema(postgresql:Client dbClient) returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS merchants (
            id TEXT PRIMARY KEY,
            owner_user_id TEXT NOT NULL UNIQUE,
            owner_username TEXT NOT NULL DEFAULT '',
            business_name TEXT NOT NULL,
            registration_number TEXT NOT NULL,
            country TEXT NOT NULL,
            currency TEXT NOT NULL,
            status TEXT NOT NULL,
            account_name TEXT NOT NULL,
            account_number TEXT NOT NULL,
            bank_name TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS payment_links (
            id TEXT PRIMARY KEY,
            merchant_id TEXT NOT NULL REFERENCES merchants(id),
            amount NUMERIC NOT NULL,
            currency TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL,
            expires_at TIMESTAMPTZ
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            payment_link_id TEXT NOT NULL REFERENCES payment_links(id),
            merchant_id TEXT NOT NULL REFERENCES merchants(id),
            method TEXT NOT NULL,
            amount NUMERIC NOT NULL,
            currency TEXT NOT NULL,
            status TEXT NOT NULL,
            provider_reference TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS payouts (
            id TEXT PRIMARY KEY,
            merchant_id TEXT NOT NULL REFERENCES merchants(id),
            amount NUMERIC NOT NULL,
            currency TEXT NOT NULL,
            payout_type TEXT NOT NULL,
            status TEXT NOT NULL,
            scheduled_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS disputes (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL REFERENCES transactions(id),
            reason TEXT NOT NULL,
            amount NUMERIC NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL,
            resolved_at TIMESTAMPTZ
        )
    `);
    log:printInfo("payments-api schema ready");
}

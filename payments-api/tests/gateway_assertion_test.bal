// Tests for the gateway-assertion verifier (gateway_assertion.bal), per the
// `ballerina` skill's testing guide: a throwaway RSA keypair mints every
// assertion here — nothing in this file talks to a real gateway or IdP.
//
// GATEWAY_ASSERTION_CERTIFICATE / _ISSUER / _HEADER must be exported in the
// shell BEFORE `bal test` runs (the interceptor reads them once, at module
// init) — see tests/resources/README below for the exact values used here.
//
// A small test-only service, on its own listener, wears the same
// AssertionInterceptor the real service does. It needs no store and no
// external client, so these tests exercise only the verifier: a valid
// assertion is accepted, one signed by a different key is a 401, one whose
// payload was edited after signing is a 401 (never an anonymous caller), and
// a resource that reads no identity answers 200 with no assertion at all.

import ballerina/crypto;
import ballerina/http;
import ballerina/jwt;
import ballerina/test;

listener http:Listener assertionTestListener = new (9099);

service http:InterceptableService /assertiontest on assertionTestListener {
    public function createInterceptors() returns AssertionInterceptor => new;

    resource function get open() returns http:Ok {
        return {};
    }

    resource function get protected(http:RequestContext ctx) returns string|http:Unauthorized {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        return caller.userId;
    }
}

const string TEST_ISSUER = "test-gateway-issuer";
const string ASSERTION_HEADER_NAME = "x-jwt-assertion";
const string GENUINE_KEY_FILE = "tests/resources/genuine_key.pem";
const string OTHER_KEY_FILE = "tests/resources/other_key.pem";

final http:Client assertionTestClient = check new ("http://localhost:9099");

function mintAssertion(string keyFile, string subject, string scope) returns string|error {
    crypto:PrivateKey privateKey = check crypto:decodeRsaPrivateKeyFromKeyFile(keyFile);
    jwt:IssuerConfig issuerConfig = {
        issuer: TEST_ISSUER,
        username: subject,
        expTime: 60,
        customClaims: {"scope": scope},
        signatureConfig: {
            algorithm: jwt:RS256,
            config: privateKey
        }
    };
    return jwt:issue(issuerConfig);
}

// Flips the last character of the payload segment so the signature no longer
// matches — the header and signature segments are untouched.
function tamperPayload(string token) returns string|error {
    string[] parts = re `\.`.split(token);
    if parts.length() != 3 {
        return error("unexpected JWT shape: " + token);
    }
    string payload = parts[1];
    string lastChar = payload.substring(payload.length() - 1, payload.length());
    string replacement = lastChar == "A" ? "B" : "A";
    string tamperedPayload = payload.substring(0, payload.length() - 1) + replacement;
    return parts[0] + "." + tamperedPayload + "." + parts[2];
}

@test:Config {}
function testValidAssertionIsAccepted() returns error? {
    string token = check mintAssertion(GENUINE_KEY_FILE, "user-123", "merchants:read");
    http:Response res = check assertionTestClient->get("/assertiontest/protected",
        {[ASSERTION_HEADER_NAME]: token});
    test:assertEquals(res.statusCode, 200);
    string body = check res.getTextPayload();
    test:assertEquals(body, "user-123");
}

@test:Config {}
function testAssertionSignedByAnotherKeyIsUnauthorized() returns error? {
    string token = check mintAssertion(OTHER_KEY_FILE, "user-123", "merchants:read");
    http:Response res = check assertionTestClient->get("/assertiontest/protected",
        {[ASSERTION_HEADER_NAME]: token});
    test:assertEquals(res.statusCode, 401);
}

@test:Config {}
function testTamperedAssertionIsUnauthorized() returns error? {
    string token = check mintAssertion(GENUINE_KEY_FILE, "user-123", "merchants:read");
    string tampered = check tamperPayload(token);
    http:Response res = check assertionTestClient->get("/assertiontest/protected",
        {[ASSERTION_HEADER_NAME]: tampered});
    test:assertEquals(res.statusCode, 401);
}

@test:Config {}
function testPublicResourceNeedsNoAssertion() returns error? {
    http:Response res = check assertionTestClient->get("/assertiontest/open");
    test:assertEquals(res.statusCode, 200);
}

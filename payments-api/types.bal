// Row shapes read straight off Postgres, and the conversions between them and
// the OpenAPI-generated API records in openapi_service.bal. A row's enum-like
// columns are plain `string` — the sql module has no literal-union binding —
// and the `asXxx` functions below are where a bad value becomes a caught
// `error` rather than a runtime type-cast panic.

import ballerina/time;

public type MerchantRow record {|
    string id;
    string ownerUserId;
    string ownerUsername;
    string businessName;
    string registrationNumber;
    string country;
    string currency;
    string status;
    string accountName;
    string accountNumber;
    string bankName;
    time:Utc createdAt;
|};

public type PaymentLinkRow record {|
    string id;
    string merchantId;
    decimal amount;
    string currency;
    string description;
    string status;
    time:Utc createdAt;
    time:Utc? expiresAt;
|};

public type TransactionRow record {|
    string id;
    string paymentLinkId;
    string merchantId;
    string method;
    decimal amount;
    string currency;
    string status;
    string providerReference;
    time:Utc createdAt;
|};

public type PayoutRow record {|
    string id;
    string merchantId;
    decimal amount;
    string currency;
    string payoutType;
    string status;
    time:Utc? scheduledAt;
    time:Utc? completedAt;
|};

public type DisputeRow record {|
    string id;
    string transactionId;
    string reason;
    decimal amount;
    string status;
    time:Utc createdAt;
    time:Utc? resolvedAt;
|};

function asCountry(string s) returns "NG"|"KE"|"GH"|error {
    if s == "NG" {
        return "NG";
    }
    if s == "KE" {
        return "KE";
    }
    if s == "GH" {
        return "GH";
    }
    return error("invalid country: " + s);
}

function asCurrency(string s) returns "NGN"|"KES"|"GHS"|error {
    if s == "NGN" {
        return "NGN";
    }
    if s == "KES" {
        return "KES";
    }
    if s == "GHS" {
        return "GHS";
    }
    return error("invalid currency: " + s);
}

function asMerchantStatus(string s) returns "pending"|"approved"|"rejected"|"suspended"|error {
    if s == "pending" {
        return "pending";
    }
    if s == "approved" {
        return "approved";
    }
    if s == "rejected" {
        return "rejected";
    }
    if s == "suspended" {
        return "suspended";
    }
    return error("invalid merchant status: " + s);
}

function asPaymentLinkStatus(string s) returns "open"|"paid"|"expired"|error {
    if s == "open" {
        return "open";
    }
    if s == "paid" {
        return "paid";
    }
    if s == "expired" {
        return "expired";
    }
    return error("invalid payment link status: " + s);
}

function asTransactionMethod(string s) returns "mobile_money"|"card"|error {
    if s == "mobile_money" {
        return "mobile_money";
    }
    if s == "card" {
        return "card";
    }
    return error("invalid transaction method: " + s);
}

function asTransactionStatus(string s) returns "pending"|"completed"|"failed"|"disputed"|"refunded"|error {
    if s == "pending" {
        return "pending";
    }
    if s == "completed" {
        return "completed";
    }
    if s == "failed" {
        return "failed";
    }
    if s == "disputed" {
        return "disputed";
    }
    if s == "refunded" {
        return "refunded";
    }
    return error("invalid transaction status: " + s);
}

function asPayoutType(string s) returns "automatic"|"manual"|error {
    if s == "automatic" {
        return "automatic";
    }
    if s == "manual" {
        return "manual";
    }
    return error("invalid payout type: " + s);
}

function asPayoutStatus(string s) returns "pending"|"completed"|"failed"|error {
    if s == "pending" {
        return "pending";
    }
    if s == "completed" {
        return "completed";
    }
    if s == "failed" {
        return "failed";
    }
    return error("invalid payout status: " + s);
}

function asDisputeStatus(string s) returns "open"|"resolved-merchant"|"resolved-customer"|error {
    if s == "open" {
        return "open";
    }
    if s == "resolved-merchant" {
        return "resolved-merchant";
    }
    if s == "resolved-customer" {
        return "resolved-customer";
    }
    return error("invalid dispute status: " + s);
}

function rowToMerchant(MerchantRow row) returns Merchant|error {
    "NG"|"KE"|"GH" country = check asCountry(row.country);
    "NGN"|"KES"|"GHS" currency = check asCurrency(row.currency);
    "pending"|"approved"|"rejected"|"suspended" status = check asMerchantStatus(row.status);
    return {
        id: row.id,
        businessName: row.businessName,
        registrationNumber: row.registrationNumber,
        country: country,
        currency: currency,
        status: status,
        bankAccount: {accountName: row.accountName, accountNumber: row.accountNumber, bankName: row.bankName},
        createdAt: toRfc3339(row.createdAt)
    };
}

function rowToPaymentLink(PaymentLinkRow row) returns PaymentLink|error {
    "NGN"|"KES"|"GHS" currency = check asCurrency(row.currency);
    "open"|"paid"|"expired" status = check asPaymentLinkStatus(row.status);
    time:Utc? expiresAt = row.expiresAt;
    return {
        id: row.id,
        merchantId: row.merchantId,
        amount: row.amount,
        currency: currency,
        description: row.description,
        status: status,
        createdAt: toRfc3339(row.createdAt),
        expiresAt: expiresAt is time:Utc ? toRfc3339(expiresAt) : ()
    };
}

function rowToPaymentLinkPublic(PaymentLinkRow row, string merchantName) returns PaymentLinkPublic|error {
    "NGN"|"KES"|"GHS" currency = check asCurrency(row.currency);
    "open"|"paid"|"expired" status = check asPaymentLinkStatus(row.status);
    return {
        id: row.id,
        merchantName: merchantName,
        amount: row.amount,
        currency: currency,
        description: row.description,
        status: status
    };
}

function rowToTransaction(TransactionRow row) returns Transaction|error {
    "mobile_money"|"card" method = check asTransactionMethod(row.method);
    "NGN"|"KES"|"GHS" currency = check asCurrency(row.currency);
    "pending"|"completed"|"failed"|"disputed"|"refunded" status = check asTransactionStatus(row.status);
    return {
        id: row.id,
        paymentLinkId: row.paymentLinkId,
        merchantId: row.merchantId,
        method: method,
        amount: row.amount,
        currency: currency,
        status: status,
        providerReference: row.providerReference,
        createdAt: toRfc3339(row.createdAt)
    };
}

function rowToPayout(PayoutRow row) returns Payout|error {
    "NGN"|"KES"|"GHS" currency = check asCurrency(row.currency);
    "automatic"|"manual" payoutType = check asPayoutType(row.payoutType);
    "pending"|"completed"|"failed" status = check asPayoutStatus(row.status);
    time:Utc? scheduledAt = row.scheduledAt;
    time:Utc? completedAt = row.completedAt;
    return {
        id: row.id,
        merchantId: row.merchantId,
        amount: row.amount,
        currency: currency,
        'type: payoutType,
        status: status,
        scheduledAt: scheduledAt is time:Utc ? toRfc3339(scheduledAt) : (),
        completedAt: completedAt is time:Utc ? toRfc3339(completedAt) : ()
    };
}

function rowToDispute(DisputeRow row) returns Dispute|error {
    "open"|"resolved-merchant"|"resolved-customer" status = check asDisputeStatus(row.status);
    time:Utc? resolvedAt = row.resolvedAt;
    return {
        id: row.id,
        transactionId: row.transactionId,
        reason: row.reason,
        amount: row.amount,
        status: status,
        createdAt: toRfc3339(row.createdAt),
        resolvedAt: resolvedAt is time:Utc ? toRfc3339(resolvedAt) : ()
    };
}

// Dispute persistence — payments-db, table `disputes`. A dispute debits the
// merchant's balance the moment it is raised (REQ-021): `availableBalance` in
// payout_store.bal counts every dispute whose status is `open` or
// `resolved-customer` against the merchant, so `resolved-merchant` — the only
// state that stops counting — is exactly the reversal.
//
// NOTE: openapi.yaml exposes no operation that raises a dispute (only
// `GET /disputes` and `POST /disputes/{id}/resolve`), and internal-payments-api
// carries no chargeback/dispute signal either. `raiseDispute` below is the
// debit-on-open half of REQ-021, wired and correct, but nothing in the current
// contract calls it — see the discrepancy noted in the final report.

import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

function raiseDispute(string transactionId, string reason, decimal amount) returns DisputeRow|error {
    string id = uuid:createRandomUuid();
    time:Utc createdAt = time:utcNow();
    _ = check (check getDb())->execute(`
        INSERT INTO disputes (id, transaction_id, reason, amount, status, created_at, resolved_at)
        VALUES (${id}, ${transactionId}, ${reason}, ${amount}, ${"open"}, ${createdAt}, ${()})
    `);
    _ = check setTransactionStatus(transactionId, "disputed");
    return getDisputeById(id);
}

function getDisputeById(string id) returns DisputeRow|error {
    return (check getDb())->queryRow(`SELECT * FROM disputes WHERE id = ${id}`);
}

function resolveDisputeRow(string id, string outcome) returns DisputeRow|error {
    time:Utc resolvedAt = time:utcNow();
    _ = check (check getDb())->execute(`
        UPDATE disputes SET status = ${outcome}, resolved_at = ${resolvedAt} WHERE id = ${id}
    `);
    return getDisputeById(id);
}

function listDisputes(string? status, int 'limit, int offset) returns [DisputeRow[], int]|error {
    sql:ParameterizedQuery whereClause = status is string ? `WHERE status = ${status}` : ``;
    sql:ParameterizedQuery countQuery = sql:queryConcat(`SELECT COUNT(*) AS total FROM disputes `, whereClause);
    record {|int total;|} countRow = check (check getDb())->queryRow(countQuery);
    sql:ParameterizedQuery dataQuery = sql:queryConcat(
        `SELECT * FROM disputes `, whereClause, ` ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}`
    );
    stream<DisputeRow, sql:Error?> rows = (check getDb())->query(dataQuery);
    DisputeRow[] disputes = [];
    check from DisputeRow row in rows
        do {
            disputes.push(row);
        };
    check rows.close();
    return [disputes, countRow.total];
}

# Sum of disputes still debiting a merchant's balance — `open` (just raised) or
# `resolved-customer` (the merchant lost, the debit stands). `resolved-merchant`
# is excluded, which is the reversal.
#
# + merchantId - the merchant
# + return - the total, or 0 when there are none
function sumStandingDisputeDebits(string merchantId) returns decimal|error {
    record {|decimal total;|} row = check (check getDb())->queryRow(`
        SELECT COALESCE(SUM(d.amount), 0) AS total
        FROM disputes d
        JOIN transactions t ON t.id = d.transaction_id
        WHERE t.merchant_id = ${merchantId} AND d.status IN ('open', 'resolved-customer')
    `);
    return row.total;
}

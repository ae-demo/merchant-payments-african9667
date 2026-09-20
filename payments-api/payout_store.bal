// Payout persistence — payments-db, table `payouts` — and the balance ledger
// every payout (automatic or on-demand) is computed against:
//
//   available balance = completed transactions
//                      - standing dispute debits (REQ-021)
//                      - amounts already paid out or in flight
//
// Nothing is stored as a running total; it is a ledger of the rows above,
// recomputed per read, so a payout or a dispute resolution never has to keep a
// cached balance in sync.

import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

function sumCommittedPayouts(string merchantId) returns decimal|error {
    record {|decimal total;|} row = check (check getDb())->queryRow(`
        SELECT COALESCE(SUM(amount), 0) AS total FROM payouts
        WHERE merchant_id = ${merchantId} AND status IN ('pending', 'completed')
    `);
    return row.total;
}

# The merchant's available balance right now.
#
# + merchantId - the merchant
# + return - the amount available to pay out
function availableBalance(string merchantId) returns decimal|error {
    decimal collected = check sumCompletedTransactions(merchantId);
    decimal disputed = check sumStandingDisputeDebits(merchantId);
    decimal paidOrPending = check sumCommittedPayouts(merchantId);
    return collected - disputed - paidOrPending;
}

function insertPayout(string merchantId, decimal amount, string currency, string payoutType, string status)
        returns PayoutRow|error {
    string id = uuid:createRandomUuid();
    time:Utc scheduledAt = time:utcNow();
    _ = check (check getDb())->execute(`
        INSERT INTO payouts (id, merchant_id, amount, currency, payout_type, status, scheduled_at, completed_at)
        VALUES (${id}, ${merchantId}, ${amount}, ${currency}, ${payoutType}, ${status}, ${scheduledAt}, ${()})
    `);
    return getPayoutById(id);
}

function getPayoutById(string id) returns PayoutRow|error {
    return (check getDb())->queryRow(`SELECT * FROM payouts WHERE id = ${id}`);
}

function completePayout(string id) returns error? {
    time:Utc completedAt = time:utcNow();
    _ = check (check getDb())->execute(`
        UPDATE payouts SET status = ${"completed"}, completed_at = ${completedAt} WHERE id = ${id}
    `);
}

function failPayout(string id) returns error? {
    _ = check (check getDb())->execute(`UPDATE payouts SET status = ${"failed"} WHERE id = ${id}`);
}

function listPayoutsForMerchant(string merchantId, int 'limit, int offset) returns [PayoutRow[], int]|error {
    record {|int total;|} countRow = check (check getDb())->queryRow(`
        SELECT COUNT(*) AS total FROM payouts WHERE merchant_id = ${merchantId}
    `);
    stream<PayoutRow, sql:Error?> rows = (check getDb())->query(`
        SELECT * FROM payouts WHERE merchant_id = ${merchantId}
        ORDER BY scheduled_at DESC LIMIT ${'limit} OFFSET ${offset}
    `);
    PayoutRow[] payouts = [];
    check from PayoutRow row in rows
        do {
            payouts.push(row);
        };
    check rows.close();
    return [payouts, countRow.total];
}

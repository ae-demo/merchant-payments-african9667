// Transaction persistence — payments-db, table `transactions`. One row per
// payment attempt against a payment link.

import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

function insertTransaction(string paymentLinkId, string merchantId, string method, decimal amount,
        string currency, string status, string providerReference) returns TransactionRow|error {
    string id = uuid:createRandomUuid();
    time:Utc createdAt = time:utcNow();
    _ = check (check getDb())->execute(`
        INSERT INTO transactions (id, payment_link_id, merchant_id, method, amount, currency, status,
                                   provider_reference, created_at)
        VALUES (${id}, ${paymentLinkId}, ${merchantId}, ${method}, ${amount}, ${currency}, ${status},
                ${providerReference}, ${createdAt})
    `);
    return getTransactionById(id);
}

function getTransactionById(string id) returns TransactionRow|error {
    return (check getDb())->queryRow(`SELECT * FROM transactions WHERE id = ${id}`);
}

function setTransactionStatus(string id, string status) returns error? {
    _ = check (check getDb())->execute(`UPDATE transactions SET status = ${status} WHERE id = ${id}`);
}

function listTransactionsForMerchant(string merchantId, string? status, int 'limit, int offset)
        returns [TransactionRow[], int]|error {
    sql:ParameterizedQuery whereClause = status is string
        ? `WHERE merchant_id = ${merchantId} AND status = ${status}`
        : `WHERE merchant_id = ${merchantId}`;
    return queryTransactionPage(whereClause, 'limit, offset);
}

function listAllTransactions(string? merchantId, string? status, int 'limit, int offset)
        returns [TransactionRow[], int]|error {
    sql:ParameterizedQuery whereClause = buildAllTransactionsFilter(merchantId, status);
    return queryTransactionPage(whereClause, 'limit, offset);
}

function buildAllTransactionsFilter(string? merchantId, string? status) returns sql:ParameterizedQuery {
    if merchantId is string && status is string {
        return `WHERE merchant_id = ${merchantId} AND status = ${status}`;
    }
    if merchantId is string {
        return `WHERE merchant_id = ${merchantId}`;
    }
    if status is string {
        return `WHERE status = ${status}`;
    }
    return ``;
}

function queryTransactionPage(sql:ParameterizedQuery whereClause, int 'limit, int offset)
        returns [TransactionRow[], int]|error {
    sql:ParameterizedQuery countQuery = sql:queryConcat(`SELECT COUNT(*) AS total FROM transactions `, whereClause);
    record {|int total;|} countRow = check (check getDb())->queryRow(countQuery);
    sql:ParameterizedQuery dataQuery = sql:queryConcat(
        `SELECT * FROM transactions `, whereClause, ` ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}`
    );
    stream<TransactionRow, sql:Error?> rows = (check getDb())->query(dataQuery);
    TransactionRow[] transactions = [];
    check from TransactionRow row in rows
        do {
            transactions.push(row);
        };
    check rows.close();
    return [transactions, countRow.total];
}

# Sum of completed transactions for a merchant — the collected side of its ledger.
#
# + merchantId - the merchant
# + return - the total, or 0 when there are none
function sumCompletedTransactions(string merchantId) returns decimal|error {
    record {|decimal total;|} row = check (check getDb())->queryRow(`
        SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
        WHERE merchant_id = ${merchantId} AND status = 'completed'
    `);
    return row.total;
}

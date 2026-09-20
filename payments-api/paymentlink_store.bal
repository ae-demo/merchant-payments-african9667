// Payment-link persistence — payments-db, table `payment_links`.

import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

function insertPaymentLink(string merchantId, PaymentLinkInput input) returns PaymentLinkRow|error {
    string id = uuid:createRandomUuid();
    time:Utc createdAt = time:utcNow();
    string description = input.description;
    _ = check (check getDb())->execute(`
        INSERT INTO payment_links (id, merchant_id, amount, currency, description, status, created_at, expires_at)
        VALUES (${id}, ${merchantId}, ${input.amount}, ${input.currency}, ${description}, ${"open"}, ${createdAt}, ${()})
    `);
    return getPaymentLinkById(id);
}

function getPaymentLinkById(string id) returns PaymentLinkRow|error {
    return (check getDb())->queryRow(`SELECT * FROM payment_links WHERE id = ${id}`);
}

function setPaymentLinkStatus(string id, string status) returns error? {
    _ = check (check getDb())->execute(`UPDATE payment_links SET status = ${status} WHERE id = ${id}`);
}

function listPaymentLinksForMerchant(string merchantId, string? status, int 'limit, int offset)
        returns [PaymentLinkRow[], int]|error {
    sql:ParameterizedQuery whereClause = status is string
        ? `WHERE merchant_id = ${merchantId} AND status = ${status}`
        : `WHERE merchant_id = ${merchantId}`;
    sql:ParameterizedQuery countQuery = sql:queryConcat(`SELECT COUNT(*) AS total FROM payment_links `, whereClause);
    record {|int total;|} countRow = check (check getDb())->queryRow(countQuery);
    sql:ParameterizedQuery dataQuery = sql:queryConcat(
        `SELECT * FROM payment_links `, whereClause, ` ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}`
    );
    stream<PaymentLinkRow, sql:Error?> rows = (check getDb())->query(dataQuery);
    PaymentLinkRow[] links = [];
    check from PaymentLinkRow row in rows
        do {
            links.push(row);
        };
    check rows.close();
    return [links, countRow.total];
}

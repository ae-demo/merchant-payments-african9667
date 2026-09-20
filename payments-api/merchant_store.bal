// Merchant persistence — payments-db, table `merchants`. `/me/…` operations
// resolve rows through `ownerUserId` (the gateway assertion's `sub`); anything
// outside `/me/` reaches every row and filters on nothing else.

import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

function insertMerchant(string ownerUserId, string ownerUsername, MerchantInput input) returns MerchantRow|error {
    string id = uuid:createRandomUuid();
    time:Utc createdAt = time:utcNow();
    _ = check (check getDb())->execute(`
        INSERT INTO merchants (id, owner_user_id, owner_username, business_name, registration_number,
                                country, currency, status, account_name, account_number, bank_name, created_at)
        VALUES (${id}, ${ownerUserId}, ${ownerUsername}, ${input.businessName}, ${input.registrationNumber},
                ${input.country}, ${input.currency}, ${"pending"}, ${input.bankAccount.accountName},
                ${input.bankAccount.accountNumber}, ${input.bankAccount.bankName}, ${createdAt})
    `);
    return getMerchantById(id);
}

function getMerchantByOwner(string ownerUserId) returns MerchantRow|error {
    return (check getDb())->queryRow(`SELECT * FROM merchants WHERE owner_user_id = ${ownerUserId}`);
}

function getMerchantById(string id) returns MerchantRow|error {
    return (check getDb())->queryRow(`SELECT * FROM merchants WHERE id = ${id}`);
}

function updateMyMerchantProfile(string ownerUserId, MerchantInput input) returns MerchantRow|error {
    _ = check (check getDb())->execute(`
        UPDATE merchants
        SET business_name = ${input.businessName}, registration_number = ${input.registrationNumber},
            country = ${input.country}, currency = ${input.currency},
            account_name = ${input.bankAccount.accountName}, account_number = ${input.bankAccount.accountNumber},
            bank_name = ${input.bankAccount.bankName}
        WHERE owner_user_id = ${ownerUserId}
    `);
    return getMerchantByOwner(ownerUserId);
}

function setMerchantStatus(string id, string status) returns MerchantRow|error {
    _ = check (check getDb())->execute(`UPDATE merchants SET status = ${status} WHERE id = ${id}`);
    return getMerchantById(id);
}

function listApprovedMerchants() returns MerchantRow[]|error {
    stream<MerchantRow, sql:Error?> rows = (check getDb())->query(`SELECT * FROM merchants WHERE status = 'approved'`);
    MerchantRow[] merchants = [];
    check from MerchantRow row in rows
        do {
            merchants.push(row);
        };
    check rows.close();
    return merchants;
}

function listMerchants(string? status, int 'limit, int offset) returns [MerchantRow[], int]|error {
    sql:ParameterizedQuery whereClause = status is string ? `WHERE status = ${status}` : ``;
    sql:ParameterizedQuery countQuery = sql:queryConcat(`SELECT COUNT(*) AS total FROM merchants `, whereClause);
    record {|int total;|} countRow = check (check getDb())->queryRow(countQuery);
    sql:ParameterizedQuery dataQuery = sql:queryConcat(
        `SELECT * FROM merchants `, whereClause, ` ORDER BY created_at DESC LIMIT ${'limit} OFFSET ${offset}`
    );
    stream<MerchantRow, sql:Error?> rows = (check getDb())->query(dataQuery);
    MerchantRow[] merchants = [];
    check from MerchantRow row in rows
        do {
            merchants.push(row);
        };
    check rows.close();
    return [merchants, countRow.total];
}

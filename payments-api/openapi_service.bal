// Hand-implemented from the generated stub — every resource body filled in.
// The contract's `security` block was dropped by the generator, as the
// `ballerina` skill says it always is: the gateway already enforced it before
// this process saw the request. Only a `/me/…` resource resolves an identity
// at all, and it does so from the verified gateway assertion, never a header.

import ballerina/http;
import ballerina/sql;

listener http:Listener ep0 = new (9090);

service http:InterceptableService / on ep0 {
    public function createInterceptors() returns AssertionInterceptor => new;

    # Every dispute
    #
    # + return - Matching disputes
    resource function get disputes("open"|"resolved-merchant"|"resolved-customer"? status, int 'limit = 20, int offset = 0)
            returns DisputePage|http:InternalServerError {
        do {
            [DisputeRow[], int] result = check listDisputes(status, 'limit, offset);
            DisputeRow[] rows = result[0];
            int count = result[1];
            Dispute[] disputes = [];
            foreach DisputeRow row in rows {
                disputes.push(check rowToDispute(row));
            }
            [string?, string?] pages = paginationLinks(count, 'limit, offset, "/disputes");
            return {count: count, next: pages[0], previous: pages[1], data: disputes};
        } on fail error e {
            return internalError(e.message());
        }
    }

    # Liveness check
    #
    # + return - Service is healthy
    resource function get health() returns http:Ok {
        return {};
    }

    # The caller's own merchant profile
    #
    # + return - returns can be any of following types
    # http:Ok (The merchant profile)
    # http:NotFound (No profile yet)
    resource function get me/merchant(http:RequestContext ctx)
            returns Merchant|ErrorNotFound|http:Unauthorized|http:InternalServerError {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        do {
            MerchantRow row = check getMerchantByOwner(caller.userId);
            return check rowToMerchant(row);
        } on fail error e {
            if e is sql:NoRowsError {
                return notFound("no merchant profile yet");
            }
            return internalError(e.message());
        }
    }

    # The caller's own payment links
    #
    # + return - Matching payment links
    resource function get me/payment\-links(http:RequestContext ctx, "open"|"paid"|"expired"? status,
            int 'limit = 20, int offset = 0) returns PaymentLinkPage|http:Unauthorized|http:InternalServerError {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        MerchantRow|error merchant = getMerchantByOwner(caller.userId);
        if merchant is error {
            return {count: 0, next: (), previous: (), data: []};
        }
        do {
            [PaymentLinkRow[], int] result = check listPaymentLinksForMerchant(merchant.id, status, 'limit, offset);
            PaymentLinkRow[] rows = result[0];
            int count = result[1];
            PaymentLink[] links = [];
            foreach PaymentLinkRow row in rows {
                links.push(check rowToPaymentLink(row));
            }
            [string?, string?] pages = paginationLinks(count, 'limit, offset, "/me/payment-links");
            return {count: count, next: pages[0], previous: pages[1], data: links};
        } on fail error e {
            return internalError(e.message());
        }
    }

    # The caller's own payouts
    #
    # + return - Matching payouts
    resource function get me/payouts(http:RequestContext ctx, int 'limit = 20, int offset = 0)
            returns PayoutPage|http:Unauthorized|http:InternalServerError {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        MerchantRow|error merchant = getMerchantByOwner(caller.userId);
        if merchant is error {
            return {count: 0, next: (), previous: (), data: []};
        }
        do {
            [PayoutRow[], int] result = check listPayoutsForMerchant(merchant.id, 'limit, offset);
            PayoutRow[] rows = result[0];
            int count = result[1];
            Payout[] payouts = [];
            foreach PayoutRow row in rows {
                payouts.push(check rowToPayout(row));
            }
            [string?, string?] pages = paginationLinks(count, 'limit, offset, "/me/payouts");
            return {count: count, next: pages[0], previous: pages[1], data: payouts};
        } on fail error e {
            return internalError(e.message());
        }
    }

    # The caller's own transactions
    #
    # + return - Matching transactions
    resource function get me/transactions(http:RequestContext ctx,
            "pending"|"completed"|"failed"|"disputed"|"refunded"? status, int 'limit = 20, int offset = 0)
            returns TransactionPage|http:Unauthorized|http:InternalServerError {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        MerchantRow|error merchant = getMerchantByOwner(caller.userId);
        if merchant is error {
            return {count: 0, next: (), previous: (), data: []};
        }
        do {
            [TransactionRow[], int] result = check listTransactionsForMerchant(merchant.id, status, 'limit, offset);
            TransactionRow[] rows = result[0];
            int count = result[1];
            Transaction[] transactions = [];
            foreach TransactionRow row in rows {
                transactions.push(check rowToTransaction(row));
            }
            [string?, string?] pages = paginationLinks(count, 'limit, offset, "/me/transactions");
            return {count: count, next: pages[0], previous: pages[1], data: transactions};
        } on fail error e {
            return internalError(e.message());
        }
    }

    # Every merchant
    #
    # + return - Matching merchants
    resource function get merchants("pending"|"approved"|"rejected"|"suspended"? status, int 'limit = 20, int offset = 0)
            returns MerchantPage|http:InternalServerError {
        do {
            [MerchantRow[], int] result = check listMerchants(status, 'limit, offset);
            MerchantRow[] rows = result[0];
            int count = result[1];
            Merchant[] merchants = [];
            foreach MerchantRow row in rows {
                merchants.push(check rowToMerchant(row));
            }
            [string?, string?] pages = paginationLinks(count, 'limit, offset, "/merchants");
            return {count: count, next: pages[0], previous: pages[1], data: merchants};
        } on fail error e {
            return internalError(e.message());
        }
    }

    # Every merchant — detail view
    #
    # + return - returns can be any of following types
    # http:Ok (The merchant)
    # http:NotFound (No such merchant)
    resource function get merchants/[string merchantId]() returns Merchant|ErrorNotFound|http:InternalServerError {
        do {
            MerchantRow row = check getMerchantById(merchantId);
            return check rowToMerchant(row);
        } on fail error e {
            if e is sql:NoRowsError {
                return notFound("no such merchant");
            }
            return internalError(e.message());
        }
    }

    # A payment link's public details for the paying customer
    #
    # + return - returns can be any of following types
    # http:Ok (Amount and merchant to display on checkout)
    # http:NotFound (No such payment link)
    resource function get payment\-links/[string linkId]()
            returns PaymentLinkPublic|ErrorNotFound|http:InternalServerError {
        do {
            PaymentLinkRow link = check getPaymentLinkById(linkId);
            MerchantRow merchant = check getMerchantById(link.merchantId);
            return check rowToPaymentLinkPublic(link, merchant.businessName);
        } on fail error e {
            if e is sql:NoRowsError {
                return notFound("no such payment link");
            }
            return internalError(e.message());
        }
    }

    # Every transaction
    #
    # + return - Matching transactions
    resource function get transactions(string? merchantId,
            "pending"|"completed"|"failed"|"disputed"|"refunded"? status, int 'limit = 20, int offset = 0)
            returns TransactionPage|http:InternalServerError {
        do {
            [TransactionRow[], int] result = check listAllTransactions(merchantId, status, 'limit, offset);
            TransactionRow[] rows = result[0];
            int count = result[1];
            Transaction[] transactions = [];
            foreach TransactionRow row in rows {
                transactions.push(check rowToTransaction(row));
            }
            [string?, string?] pages = paginationLinks(count, 'limit, offset, "/transactions");
            return {count: count, next: pages[0], previous: pages[1], data: transactions};
        } on fail error e {
            return internalError(e.message());
        }
    }

    # Resolve a dispute in favor of the merchant or the customer
    #
    # + return - returns can be any of following types
    # http:Ok (Dispute resolved)
    # http:NotFound (No such dispute)
    resource function post disputes/[string disputeId]/resolve(@http:Payload DisputeResolution payload)
            returns DisputeOk|ErrorNotFound|http:InternalServerError {
        do {
            DisputeRow updated = check resolveDisputeRow(disputeId, payload.outcome);
            Dispute disputeResponse = check rowToDispute(updated);
            string|error contact = merchantContactForTransaction(updated.transactionId);
            if contact is string {
                string outcomeText = payload.outcome == "resolved-merchant"
                    ? "in your favor. The disputed amount has been restored to your balance."
                    : "in the customer's favor. The disputed amount remains debited from your balance.";
                sendEmail(contact, "Dispute resolved", "Your dispute has been resolved " + outcomeText);
            }
            return <DisputeOk>{body: disputeResponse};
        } on fail error e {
            if e is sql:NoRowsError {
                return notFound("no such dispute");
            }
            return internalError(e.message());
        }
    }

    # Submit a new merchant business profile for review
    #
    # + return - returns can be any of following types
    # http:Created (Profile created, pending review)
    # http:BadRequest (Invalid input)
    resource function post me/merchant(http:RequestContext ctx, @http:Payload MerchantInput payload)
            returns Merchant|ErrorBadRequest|http:Unauthorized|http:InternalServerError {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        MerchantRow|error existing = getMerchantByOwner(caller.userId);
        if existing is MerchantRow {
            return badRequest("a merchant profile already exists for this caller");
        }
        do {
            MerchantRow created = check insertMerchant(caller.userId, caller.username, payload);
            return check rowToMerchant(created);
        } on fail error e {
            return internalError(e.message());
        }
    }

    # Create a payment link
    #
    # + return - returns can be any of following types
    # http:Created (Payment link created)
    # http:BadRequest (Invalid input)
    resource function post me/payment\-links(http:RequestContext ctx, @http:Payload PaymentLinkInput payload)
            returns PaymentLink|ErrorBadRequest|http:Unauthorized|http:InternalServerError {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        MerchantRow|error merchant = getMerchantByOwner(caller.userId);
        if merchant is error {
            return badRequest("no merchant profile for this caller");
        }
        if merchant.status != "approved" {
            return badRequest("merchant is not approved to accept payments yet");
        }
        do {
            PaymentLinkRow created = check insertPaymentLink(merchant.id, payload);
            return check rowToPaymentLink(created);
        } on fail error e {
            return internalError(e.message());
        }
    }

    # Request an on-demand payout
    #
    # + return - returns can be any of following types
    # http:Created (Payout requested)
    # http:BadRequest (Insufficient balance)
    resource function post me/payouts(http:RequestContext ctx)
            returns Payout|ErrorBadRequest|http:Unauthorized|http:InternalServerError {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        MerchantRow|error merchant = getMerchantByOwner(caller.userId);
        if merchant is error {
            return badRequest("no merchant profile for this caller");
        }
        do {
            decimal balance = check availableBalance(merchant.id);
            if balance <= 0d {
                return badRequest("insufficient balance");
            }
            PayoutRow payoutRow = check insertPayout(merchant.id, balance, merchant.currency, "manual", "pending");
            BankAccount bankAccount = {
                accountName: merchant.accountName,
                accountNumber: merchant.accountNumber,
                bankName: merchant.bankName
            };
            GatewayOutcome|error outcome = requestPayoutFromGateway(merchant.id, balance, merchant.currency, bankAccount);
            if outcome is error {
                _ = check failPayout(payoutRow.id);
                return badRequest("payout could not be processed");
            }
            if outcome.status == "completed" {
                _ = check completePayout(payoutRow.id);
            } else if outcome.status == "failed" {
                _ = check failPayout(payoutRow.id);
            }
            PayoutRow finalRow = check getPayoutById(payoutRow.id);
            return check rowToPayout(finalRow);
        } on fail error e {
            return internalError(e.message());
        }
    }

    # Approve or reject a merchant's onboarding submission
    #
    # + return - returns can be any of following types
    # http:Ok (Review recorded)
    # http:NotFound (No such merchant)
    resource function post merchants/[string merchantId]/review(@http:Payload MerchantReview payload)
            returns MerchantOk|ErrorNotFound|http:InternalServerError {
        do {
            MerchantRow updated = check setMerchantStatus(merchantId, payload.decision);
            Merchant merchantResponse = check rowToMerchant(updated);
            string? reason = payload?.reason;
            string body = payload.decision == "approved"
                ? "Your merchant application has been approved. You can now accept live payments."
                : "Your merchant application was rejected." + (reason is string ? " Reason: " + reason : "");
            sendEmail(updated.ownerUsername, "Onboarding decision", body);
            return <MerchantOk>{body: merchantResponse};
        } on fail error e {
            if e is sql:NoRowsError {
                return notFound("no such merchant");
            }
            return internalError(e.message());
        }
    }

    # Suspend or reactivate a merchant
    #
    # + return - returns can be any of following types
    # http:Ok (Status updated)
    # http:NotFound (No such merchant)
    resource function post merchants/[string merchantId]/suspend(@http:Payload SuspendRequest payload)
            returns MerchantOk|ErrorNotFound|http:InternalServerError {
        string newStatus = payload.suspended ? "suspended" : "approved";
        do {
            MerchantRow updated = check setMerchantStatus(merchantId, newStatus);
            Merchant merchantResponse = check rowToMerchant(updated);
            return <MerchantOk>{body: merchantResponse};
        } on fail error e {
            if e is sql:NoRowsError {
                return notFound("no such merchant");
            }
            return internalError(e.message());
        }
    }

    # Pay a payment link via mobile money or card
    #
    # + return - returns can be any of following types
    # http:Accepted (Payment submitted for processing)
    # http:BadRequest (Invalid payment request)
    # http:NotFound (No such payment link)
    resource function post payment\-links/[string linkId]/pay(@http:Payload PaymentRequest payload)
            returns TransactionAccepted|ErrorBadRequest|ErrorNotFound|http:InternalServerError {
        PaymentLinkRow|error link = getPaymentLinkById(linkId);
        if link is error {
            return notFound("no such payment link");
        }
        if link.status != "open" {
            return badRequest("this payment link is no longer open");
        }
        string? phoneNumber = payload?.phoneNumber;
        string? cardToken = payload?.cardToken;
        if payload.method == "mobile_money" && (phoneNumber is () || phoneNumber == "") {
            return badRequest("phoneNumber is required for mobile_money");
        }
        if payload.method == "card" && (cardToken is () || cardToken == "") {
            return badRequest("cardToken is required for card");
        }
        do {
            GatewayOutcome outcome = check chargeCustomer(link.merchantId, link.amount, link.currency,
                payload.method, phoneNumber, cardToken);
            TransactionRow created = check insertTransaction(link.id, link.merchantId, payload.method, link.amount,
                link.currency, outcome.status, outcome.providerReference);
            if outcome.status == "completed" {
                _ = check setPaymentLinkStatus(link.id, "paid");
                if phoneNumber is string {
                    sendSms(phoneNumber, string `Payment of ${link.amount} ${link.currency} received. Thank you.`);
                }
            }
            Transaction responseBody = check rowToTransaction(created);
            return <TransactionAccepted>{body: responseBody};
        } on fail error e {
            return internalError(e.message());
        }
    }

    # Update the caller's own business and bank details
    #
    # + return - returns can be any of following types
    # http:Ok (Updated profile)
    # http:BadRequest (Invalid input)
    # http:NotFound (No profile yet)
    resource function put me/merchant(http:RequestContext ctx, @http:Payload MerchantInput payload)
            returns Merchant|ErrorNotFound|http:Unauthorized|http:InternalServerError {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        do {
            MerchantRow updated = check updateMyMerchantProfile(caller.userId, payload);
            return check rowToMerchant(updated);
        } on fail error e {
            if e is sql:NoRowsError {
                return notFound("no merchant profile yet");
            }
            return internalError(e.message());
        }
    }
}

public type MerchantReview record {
    "approved"|"rejected" decision;
    string reason?;
};

public type TransactionAccepted record {|
    *http:Accepted;
    Transaction body;
|};

public type Error record {
    # HTTP or application error code
    int code;
    # short human-readable label
    string message;
    # detailed explanation
    string description?;
    # URI to documentation
    string moreInfo?;
};

public type BankAccount record {
    string accountName;
    string accountNumber;
    string bankName;
};

public type ErrorBadRequest record {|
    *http:BadRequest;
    Error body;
|};

public type PaymentLinkPublic record {
    string id;
    string merchantName;
    decimal amount;
    "NGN"|"KES"|"GHS" currency;
    string description?;
    "open"|"paid"|"expired" status;
};

public type DisputeResolution record {
    "resolved-merchant"|"resolved-customer" outcome;
    string notes?;
};

public type PaymentLinkInput record {
    decimal amount;
    "NGN"|"KES"|"GHS" currency;
    string description;
};

public type MerchantOk record {|
    *http:Ok;
    Merchant body;
|};

public type SuspendRequest record {
    boolean suspended;
};

public type ErrorNotFound record {|
    *http:NotFound;
    Error body;
|};

public type Merchant record {
    string id;
    string businessName;
    string registrationNumber;
    "NG"|"KE"|"GH" country;
    "NGN"|"KES"|"GHS" currency;
    "pending"|"approved"|"rejected"|"suspended" status;
    BankAccount bankAccount?;
    string createdAt?;
};

public type Transaction record {
    string id;
    string paymentLinkId;
    string merchantId;
    "mobile_money"|"card" method;
    decimal amount;
    "NGN"|"KES"|"GHS" currency;
    "pending"|"completed"|"failed"|"disputed"|"refunded" status;
    string providerReference?;
    string createdAt;
};

public type PaymentLink record {
    string id;
    string merchantId;
    decimal amount;
    "NGN"|"KES"|"GHS" currency;
    string description?;
    "open"|"paid"|"expired" status;
    string createdAt;
    string? expiresAt?;
};

public type PaymentRequest record {
    "mobile_money"|"card" method;
    # required for mobile_money
    string phoneNumber?;
    # required for card
    string cardToken?;
};

public type Payout record {
    string id;
    string merchantId;
    decimal amount;
    "NGN"|"KES"|"GHS" currency;
    "automatic"|"manual" 'type;
    "pending"|"completed"|"failed" status;
    string? scheduledAt?;
    string? completedAt?;
};

public type MerchantInput record {
    string businessName;
    string registrationNumber;
    "NG"|"KE"|"GH" country;
    "NGN"|"KES"|"GHS" currency;
    BankAccount bankAccount;
};

public type PaymentLinkPage record {
    # total matching items
    int count;
    # relative URI of the next page
    string? next?;
    # relative URI of the previous page
    string? previous?;
    PaymentLink[] data;
};

public type MerchantPage record {
    # total matching items
    int count;
    # relative URI of the next page
    string? next?;
    # relative URI of the previous page
    string? previous?;
    Merchant[] data;
};

public type TransactionPage record {
    # total matching items
    int count;
    # relative URI of the next page
    string? next?;
    # relative URI of the previous page
    string? previous?;
    Transaction[] data;
};

public type Dispute record {
    string id;
    string transactionId;
    string reason;
    decimal amount;
    "open"|"resolved-merchant"|"resolved-customer" status;
    string createdAt;
    string? resolvedAt?;
};

public type PayoutPage record {
    # total matching items
    int count;
    # relative URI of the next page
    string? next?;
    # relative URI of the previous page
    string? previous?;
    Payout[] data;
};

public type DisputePage record {
    # total matching items
    int count;
    # relative URI of the next page
    string? next?;
    # relative URI of the previous page
    string? previous?;
    Dispute[] data;
};

public type DisputeOk record {|
    *http:Ok;
    Dispute body;
|};

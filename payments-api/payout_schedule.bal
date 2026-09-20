// Daily automatic payout — a background task inside this service, not a
// separate component. Every approved merchant with a positive available
// balance gets an `automatic` payout, delegated to internal-payments-api the
// same way an on-demand one is, and a payout notice by email.

import ballerina/log;
import ballerina/task;

class DailyPayoutJob {
    *task:Job;

    public function execute() {
        error? result = runAutomaticPayoutRound();
        if result is error {
            log:printError("automatic payout round failed", 'error = result);
        }
    }
}

final task:JobId payoutJobId = check task:scheduleJobRecurByFrequency(new DailyPayoutJob(), 86400);

function runAutomaticPayoutRound() returns error? {
    MerchantRow[] merchants = check listApprovedMerchants();
    foreach MerchantRow merchant in merchants {
        error? outcome = payMerchantAutomatically(merchant);
        if outcome is error {
            log:printWarn("automatic payout failed for merchant", merchantId = merchant.id, 'error = outcome);
        }
    }
}

function payMerchantAutomatically(MerchantRow merchant) returns error? {
    decimal balance = check availableBalance(merchant.id);
    if balance <= 0d {
        return;
    }
    PayoutRow payoutRow = check insertPayout(merchant.id, balance, merchant.currency, "automatic", "pending");
    BankAccount bankAccount = {
        accountName: merchant.accountName,
        accountNumber: merchant.accountNumber,
        bankName: merchant.bankName
    };
    GatewayOutcome|error outcome = requestPayoutFromGateway(merchant.id, balance, merchant.currency, bankAccount);
    if outcome is error {
        _ = check failPayout(payoutRow.id);
        return;
    }
    if outcome.status == "completed" {
        _ = check completePayout(payoutRow.id);
    } else if outcome.status == "failed" {
        _ = check failPayout(payoutRow.id);
    }
    sendEmail(merchant.ownerUsername, "Payout processed",
        string `Your automatic payout of ${balance} ${merchant.currency} has been sent to your bank account.`);
}

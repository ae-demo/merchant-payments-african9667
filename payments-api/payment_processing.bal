// Delegating charges and payouts to internal-payments-api. This service never
// moves money itself — it calls the gateway, then maps its status vocabulary
// onto ours.
//
// internal-payments-api's BankAccount takes `bankCode`, not the `bankName` a
// merchant registers here — there is no bank-code field in our domain, so
// `bankName` is passed through as the code. Flagged in the final report.

import payments_api.internal_payments;
import ballerina/uuid;

# The outcome of a delegated call to internal-payments-api, already mapped onto
# this service's own status vocabulary.
#
# + status - `pending`, `completed` or `failed` (payments), `pending`/`completed`/`failed` (payouts)
# + providerReference - the gateway's own id for the payment or payout
public type GatewayOutcome record {|
    string status;
    string providerReference;
|};

function chargeCustomer(string merchantId, decimal amount, string currency, string method, string? phoneNumber,
        string? cardToken) returns GatewayOutcome|error {
    "mobile"|"web" channel = method == "mobile_money" ? "mobile" : "web";
    int amountMinor = <int>amount;
    internal_payments:CreatePaymentRequest request = {
        merchantId: merchantId,
        amount: amountMinor,
        currency: currency,
        channel: channel,
        reference: uuid:createRandomUuid()
    };
    internal_payments:Payment payment = check paymentGatewayClient->/payments.post(request);
    string status = mapPaymentStatus(payment.status);
    return {status: status, providerReference: payment.paymentId};
}

function mapPaymentStatus(internal_payments:PaymentStatus gatewayStatus) returns string {
    if gatewayStatus == "authorized" {
        return "completed";
    }
    if gatewayStatus == "declined" {
        return "failed";
    }
    return "pending";
}

function requestPayoutFromGateway(string merchantId, decimal amount, string currency, BankAccount bankAccount)
        returns GatewayOutcome|error {
    int amountMinor = <int>amount;
    internal_payments:CreatePayoutRequest request = {
        merchantId: merchantId,
        amount: amountMinor,
        currency: currency,
        bankAccount: {accountNumber: bankAccount.accountNumber, bankCode: bankAccount.bankName},
        reference: uuid:createRandomUuid()
    };
    internal_payments:Payout payout = check paymentGatewayClient->/payouts.post(request);
    string status = mapPayoutStatus(payout.status);
    return {status: status, providerReference: payout.payoutId};
}

function mapPayoutStatus(internal_payments:PayoutStatus gatewayStatus) returns string {
    if gatewayStatus == "paid" {
        return "completed";
    }
    if gatewayStatus == "failed" {
        return "failed";
    }
    return "pending";
}

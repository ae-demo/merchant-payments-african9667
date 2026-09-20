// Best-effort notifications through sms-service and email-service. A
// notification failure never fails the caller's own request — it is logged
// and swallowed, same as a real delivery provider would be treated.

import ballerina/log;
import payments_api.email_service;
import payments_api.sms_service;

function sendSms(string toNumber, string body) {
    sms_service:SendSmsRequest request = {to: toNumber, body: body};
    sms_service:SmsMessage|error result = smsClient->/sms.post(request);
    if result is error {
        log:printWarn("sms-service send failed", to = toNumber, 'error = result);
    }
}

function sendEmail(string toAddress, string subject, string body) {
    email_service:SendEmailRequest request = {to: toAddress, subject: subject, body: body};
    email_service:EmailMessage|error result = emailClient->/emails.post(request);
    if result is error {
        log:printWarn("email-service send failed", to = toAddress, 'error = result);
    }
}

# The merchant contact address to notify for a dispute against one of its
# transactions. Merchant has no email field in the contract, so this is the
# username the gateway assertion carried when the merchant profile was
# created — best-effort, see the discrepancy noted in the final report.
#
# + transactionId - the disputed transaction
# + return - the merchant's stored contact address
function merchantContactForTransaction(string transactionId) returns string|error {
    TransactionRow transactionRow = check getTransactionById(transactionId);
    MerchantRow merchantRow = check getMerchantById(transactionRow.merchantId);
    return merchantRow.ownerUsername;
}

// One client per external dependency, at module level, built from the
// injected base URL — never a hardcoded host.

import payments_api.email_service;
import payments_api.internal_payments;
import payments_api.sms_service;

final internal_payments:Client paymentGatewayClient = check new (serviceUrl = paymentApiBaseUrl);
final sms_service:Client smsClient = check new (serviceUrl = smsServiceUrl);
final email_service:Client emailClient = check new (serviceUrl = emailServiceBaseUrl);

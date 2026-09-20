screen PaymentDetails "What the customer is paying for"
  navbar "Checkout"
  card "Amount due | 5,000 NGN | to Acme Traders"
  text "Order #204"
  row
    right
    button "Pay with Mobile Money" primary -> MobileMoneyPay
    button "Pay with Card" -> CardPay

screen MobileMoneyPay "Pay via mobile money"
  navbar "Checkout"
  card "Amount due | 5,000 NGN | to Acme Traders"
  input "Mobile money number"
  text "You will receive a prompt on your phone to confirm."
  row
    right
    button "Cancel" -> PaymentDetails
    button "Confirm payment" primary -> PaymentResult

screen CardPay "Pay via card"
  navbar "Checkout"
  card "Amount due | 5,000 NGN | to Acme Traders"
  input "Card number"
  row
    input "Expiry"
    input "CVV"
  row
    right
    button "Cancel" -> PaymentDetails
    button "Pay now" primary -> PaymentResult

screen PaymentResult "Payment outcome and receipt"
  navbar "Checkout"
  badge "Payment successful" success
  card "Amount paid | 5,000 NGN | to Acme Traders"
  text "A receipt has been sent to your phone and email."

flow "Pay a merchant"
  description "A customer opens a shared payment link and pays by mobile money or card"
  PaymentDetails
  MobileMoneyPay
  CardPay
  PaymentResult

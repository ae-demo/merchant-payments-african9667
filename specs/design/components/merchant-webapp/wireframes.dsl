screen Onboarding "Submit business details for review"
  navbar "Merchant Portal"
  heading "Complete your business profile"
  input "Business name"
  input "Registration number"
  select "Country (Nigeria / Kenya / Ghana)"
  divider
  heading "Bank account"
  input "Account name"
  input "Account number"
  input "Bank name"
  row
    right
    button "Submit for review" primary -> Dashboard

screen Dashboard "Merchant home: balance and recent activity"
  navbar "Merchant Portal"
  sidebar "Dashboard | Payment Links -> PaymentLinks | Transactions -> Transactions | Payouts -> Payouts"
  badge "Approved" success
  row
    card "Available balance | 128,400 | NGN"
    card "Pending payout | 42,000 | NGN"
    card "Open links | 6 | awaiting payment"
  heading "Recent transactions"
  table "Date | Link | Method | Amount | Status"
    row "Today | Order #204 | Mobile Money | 5,000 | Completed"
    row "Today | Order #203 | Card | 12,000 | Completed"
    row "Yesterday | Order #201 | Card | 3,500 | Disputed"

screen PaymentLinks "The merchant's payment links"
  navbar "Merchant Portal"
  sidebar "Dashboard -> Dashboard | Payment Links | Transactions -> Transactions | Payouts -> Payouts"
  row
    heading "Payment links"
    right
    button "New payment link" primary -> CreatePaymentLink
  table "Description | Amount | Status | Created" -> PaymentLinkDetail
    row "Order #204 | 5,000 NGN | Open | Today"
    row "Order #203 | 12,000 NGN | Paid | Today"

screen CreatePaymentLink "Request a payment from a customer"
  navbar "Merchant Portal"
  heading "New payment link"
  input "Description"
  input "Amount"
  select "Currency"
  row
    right
    button "Cancel" -> PaymentLinks
    button "Create link" primary -> PaymentLinkDetail

screen PaymentLinkDetail "Share this link with the customer"
  navbar "Merchant Portal"
  heading "Order #204"
  badge "Open" info
  text "Amount: 5,000 NGN"
  text "https://pay.example.com/l/abc123"
  row
    right
    button "Copy link" primary

screen Transactions "All payments received"
  navbar "Merchant Portal"
  sidebar "Dashboard -> Dashboard | Payment Links -> PaymentLinks | Transactions | Payouts -> Payouts"
  row
    heading "Transactions"
    right
    search "Search by link or reference"
    select "Status"
  table "Date | Link | Method | Amount | Status"
    row "Today | Order #204 | Mobile Money | 5,000 | Completed"
    row "Yesterday | Order #201 | Card | 3,500 | Disputed"

screen Payouts "Payout history and requests"
  navbar "Merchant Portal"
  sidebar "Dashboard -> Dashboard | Payment Links -> PaymentLinks | Transactions -> Transactions | Payouts"
  row
    card "Available balance | 128,400 | NGN"
    right
    button "Request payout" primary -> PayoutConfirm
  heading "Payout history"
  table "Date | Type | Amount | Status"
    row "Today | Automatic | 40,000 | Completed"
    row "Last week | Manual | 15,000 | Completed"

screen PayoutConfirm "Confirm an on-demand payout"
  navbar "Merchant Portal"
  heading "Request payout"
  text "128,400 NGN will be sent to your linked bank account."
  row
    right
    button "Cancel" -> Payouts
    button "Confirm payout" primary -> Payouts

flow "Onboard and get approved"
  role "Merchant"
  description "A new merchant submits business details and lands on their dashboard once approved"
  Onboarding
  Dashboard

flow "Collect a payment"
  role "Merchant"
  description "A merchant creates a payment link and shares it with a customer"
  Dashboard
  PaymentLinks
  CreatePaymentLink
  PaymentLinkDetail

flow "Track transactions and payouts"
  role "Merchant"
  description "A merchant reviews received payments and requests a payout"
  Dashboard
  Transactions
  Payouts
  PayoutConfirm

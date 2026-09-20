screen OnboardingQueue "Merchant applications awaiting review"
  navbar "Admin Console"
  sidebar "Onboarding | Merchants -> Merchants | Transactions -> AllTransactions | Disputes -> DisputesQueue"
  heading "Pending merchants"
  table "Business | Country | Submitted" -> MerchantDetail
    row "Acme Traders | Nigeria | Today"
    row "Kilimo Foods | Kenya | Yesterday"

screen MerchantDetail "Review a merchant's submission"
  navbar "Admin Console"
  heading "Acme Traders"
  badge "Pending" warning
  text "Registration number: RC-884213"
  text "Country: Nigeria — Currency: NGN"
  divider
  heading "Bank account"
  text "GTBank — 0123456789 — Acme Traders Ltd"
  row
    right
    button "Reject" danger -> OnboardingQueue
    button "Approve" primary -> OnboardingQueue

screen Merchants "Every merchant on the platform"
  navbar "Admin Console"
  sidebar "Onboarding -> OnboardingQueue | Merchants | Transactions -> AllTransactions | Disputes -> DisputesQueue"
  row
    heading "Merchants"
    right
    search "Search by business name"
    select "Status"
  table "Business | Country | Status" -> MerchantAccount
    row "Acme Traders | Nigeria | Approved"
    row "Savanna Goods | Ghana | Suspended"

screen MerchantAccount "Manage a merchant's account status"
  navbar "Admin Console"
  heading "Savanna Goods"
  badge "Suspended" danger
  text "Country: Ghana — Currency: GHS"
  row
    right
    button "Reactivate account" primary -> Merchants

screen AllTransactions "Transactions across every merchant"
  navbar "Admin Console"
  sidebar "Onboarding -> OnboardingQueue | Merchants -> Merchants | Transactions | Disputes -> DisputesQueue"
  row
    heading "Transactions"
    right
    search "Search by merchant or reference"
    select "Status"
  table "Merchant | Method | Amount | Status | Date"
    row "Acme Traders | Card | 12,000 NGN | Completed | Today"
    row "Kilimo Foods | Mobile Money | 2,400 KES | Disputed | Yesterday"

screen DisputesQueue "Disputed transactions awaiting resolution"
  navbar "Admin Console"
  sidebar "Onboarding -> OnboardingQueue | Merchants -> Merchants | Transactions -> AllTransactions | Disputes"
  heading "Open disputes"
  table "Merchant | Amount | Reason | Raised" -> DisputeDetail
    row "Kilimo Foods | 2,400 KES | Item not received | Yesterday"

screen DisputeDetail "Resolve a dispute"
  navbar "Admin Console"
  heading "Dispute on transaction #TX-9911"
  text "Merchant: Kilimo Foods — Amount: 2,400 KES"
  text "Reason: Item not received"
  textarea "Resolution notes"
  row
    right
    button "Resolve for customer" danger -> DisputesQueue
    button "Resolve for merchant" primary -> DisputesQueue

flow "Review onboarding"
  role "Platform Admin"
  description "An admin reviews and approves or rejects a new merchant"
  OnboardingQueue
  MerchantDetail

flow "Oversee merchants and transactions"
  role "Platform Admin"
  description "An admin browses all merchants and transactions, and manages a merchant's status"
  Merchants
  MerchantAccount
  AllTransactions

flow "Resolve a dispute"
  role "Platform Admin"
  description "An admin reviews a disputed transaction and resolves it"
  DisputesQueue
  DisputeDetail

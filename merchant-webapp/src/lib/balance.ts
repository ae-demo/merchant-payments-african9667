// payments-api's openapi.yaml has no balance/summary endpoint (checked against
// specs/design/components/payments-api/openapi.yaml — see the report for this
// discrepancy). The Dashboard and Payouts wireframes both draw an "Available
// balance" stat, so it is derived client-side from the caller's own
// transactions and payouts:
//
//   available balance = completed transactions - completed payouts
//                                                - pending payouts
//
// (money collected, minus money already paid out or currently earmarked for
// an in-flight payout). This is an approximation of a real ledger balance,
// not a value payments-api returns.

export interface BalanceInputs {
  readonly transactions: readonly { status: string; amount: number }[];
  readonly payouts: readonly { status: string; amount: number }[];
}

export interface BalanceSummary {
  readonly availableBalance: number;
  readonly pendingPayout: number;
}

function sumBy<T>(items: readonly T[], predicate: (item: T) => boolean, amountOf: (item: T) => number): number {
  return items.filter(predicate).reduce((total, item) => total + amountOf(item), 0);
}

export function computeBalance({ transactions, payouts }: BalanceInputs): BalanceSummary {
  const collected = sumBy(transactions, (t) => t.status === "completed", (t) => t.amount);
  const paidOut = sumBy(payouts, (p) => p.status === "completed", (p) => p.amount);
  const pendingPayout = sumBy(payouts, (p) => p.status === "pending", (p) => p.amount);
  const availableBalance = Math.max(0, collected - paidOut - pendingPayout);
  return { availableBalance, pendingPayout };
}

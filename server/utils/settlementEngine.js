// utils/settlementEngine.js
// Greedy minimal-transaction settlement algorithm
// Ported from legacy/js/settlementEngine.js (originally built by Rishab)
//
// Works with real MongoDB data instead of hardcoded demo data.
// Demonstrates: reduce, filter, sort, higher-order functions (Lecture 12-14)

/**
 * calculateNetBalances
 * For each expense:
 *   - The payer gets +totalAmount (they are owed money)
 *   - Each participant gets -share (they owe money)
 * Net positive  → person is a creditor (gets money back)
 * Net negative  → person is a debtor   (owes money)
 *
 * Uses integer-paise internally to avoid floating-point rounding errors.
 *
 * @param {Array}  expenses – GroupExpense documents (populated or plain)
 * @param {string[]} memberIds – array of user ID strings
 * @returns {{ [userId: string]: number }}  net balance in rupees (rounded to 2 decimal places)
 */
function calculateNetBalances(expenses, memberIds) {
  // Initialize every member with zero paise
  const balancesPaise = memberIds.reduce((acc, id) => {
    acc[id.toString()] = 0;
    return acc;
  }, {});

  expenses.forEach((expense) => {
    const payerId = (expense.paidBy?._id || expense.paidBy).toString();

    // Ensure payer exists in map (edge case: payer removed from group)
    if (!(payerId in balancesPaise)) balancesPaise[payerId] = 0;

    // Payer is credited the full amount in paise
    balancesPaise[payerId] += Math.round(Number(expense.totalAmount) * 100);

    // Each participant is debited their share in paise
    expense.participants.forEach((participant) => {
      const uid = (participant.userId?._id || participant.userId).toString();
      if (!(uid in balancesPaise)) balancesPaise[uid] = 0;
      balancesPaise[uid] -= Math.round(Number(participant.share) * 100);
    });
  });

  // Convert paise back to rupees
  const balances = {};
  for (const [id, paise] of Object.entries(balancesPaise)) {
    balances[id] = Math.round(paise) / 100;
  }

  return balances;
}

/**
 * computeSettlement
 * Greedy debtor–creditor algorithm: at most N-1 transactions for N people.
 * Matches the largest debtor to the largest creditor each round.
 * Uses integer paise to ensure zero floating-point remainder errors.
 *
 * @param {{ [userId: string]: number }} balances
 * @returns {{ from: string, to: string, amount: number }[]}
 */
function computeSettlement(balances) {
  // Separate into creditors (positive) and debtors (negative) in integer paise
  const creditors = Object.entries(balances)
    .map(([id, v]) => [id, Math.round(v * 100)])
    .filter(([, paise]) => paise > 0)
    .sort((a, b) => b[1] - a[1]); // largest credit first

  const debtors = Object.entries(balances)
    .map(([id, v]) => [id, Math.round(v * 100)])
    .filter(([, paise]) => paise < 0)
    .sort((a, b) => a[1] - b[1]); // most negative first (largest debt)

  const transactions = [];

  let i = 0; // debtor pointer
  let j = 0; // creditor pointer

  while (i < debtors.length && j < creditors.length) {
    const debtor   = debtors[i];
    const creditor = creditors[j];

    // Transfer amount is min of debt magnitude and credit magnitude in paise
    const amountPaise = Math.min(-debtor[1], creditor[1]);

    if (amountPaise > 0) {
      transactions.push({
        from:   debtor[0],
        to:     creditor[0],
        amount: Math.round(amountPaise) / 100, // format to rupees
      });

      debtor[1]   += amountPaise;   // reduce debtor's debt
      creditor[1] -= amountPaise;   // reduce creditor's credit
    }

    if (debtor[1] === 0) i++;
    if (creditor[1] === 0) j++;
  }

  return transactions;
}

module.exports = { calculateNetBalances, computeSettlement };

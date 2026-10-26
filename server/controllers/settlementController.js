// controllers/settlementController.js
// Handles settlement payment recording and returns refreshed settlement data

const GroupPayment = require('../models/GroupPayment');
const Group = require('../models/Group');
const GroupExpense = require('../models/GroupExpense');
const { calculateNetBalances, computeSettlement } = require('../utils/settlementEngine');

// Helper to verify the requester is a member of the group
const assertMember = (group, userId) => {
  const targetId = userId.toString();
  const isMember = group.members.some(m => ((m._id || m).toString()) === targetId);
  if (!isMember) {
    const err = new Error('Not authorized. You are not a member of this group.');
    err.statusCode = 403;
    throw err;
  }
};

/**
 * POST /api/groups/:id/settlement/pay
 * Records a payment (settlement) between two members and returns the updated
 * settlement view (net balances and repayment plan).
 */
const paySettlement = async (req, res, next) => {
  try {
    const { id } = req.params; // group id
    const { from, to, amount } = req.body;
    const numAmount = Number(amount);
    if (!from || !to || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment payload.' });
    }

    // Load group with members for validation
    const group = await Group.findById(id).populate('members', 'name email');
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    // Ensure the caller belongs to the group
    assertMember(group, req.user._id);

    const memberIds = group.members.map(m => (m._id || m).toString());
    if (!memberIds.includes(from.toString()) || !memberIds.includes(to.toString())) {
      return res.status(400).json({ success: false, message: 'Both parties must be members of the group.' });
    }

    // Persist the payment record
    await GroupPayment.create({ groupId: id, from, to, amount: numAmount });

    // Re‑calculate settlement using fresh data (expenses + payments)
    const expenses = await GroupExpense.find({ groupId: id })
      .populate('paidBy', 'name email')
      .populate('participants.userId', 'name email');

    // Base balances from expenses
    const balances = calculateNetBalances(expenses, memberIds);

    // Apply all stored payments to the balances
    const payments = await GroupPayment.find({ groupId: id });
    payments.forEach(p => {
      const amt = Number(p.amount);
      // "from" gave money, so they are owed -> increase balance
      if (balances[p.from] !== undefined) balances[p.from] += amt; else balances[p.from] = amt;
      // "to" received money, so their debt decreases -> decrease balance
      if (balances[p.to] !== undefined) balances[p.to] -= amt; else balances[p.to] = -amt;
    });

    // Build helper maps for UI rendering
    const userMap = {};
    group.members.forEach(m => { userMap[(m._id || m).toString()] = m.name || m.email; });

    const transactions = computeSettlement(balances);

    const formattedBalances = Object.entries(balances).map(([uid, amt]) => ({
      userId: uid,
      name: userMap[uid] || uid,
      amount: Math.round(amt * 100) / 100,
      status: amt > 0.005 ? 'creditor' : amt < -0.005 ? 'debtor' : 'settled',
    }));

    const formattedTransactions = transactions.map(t => ({
      from: t.from,
      fromName: userMap[t.from] || t.from,
      to: t.to,
      toName: userMap[t.to] || t.to,
      amount: t.amount,
    }));

    res.json({
      success: true,
      data: {
        group: { _id: group._id, name: group.name },
        netBalances: balances,
        balances: formattedBalances,
        settlementPlan: formattedTransactions,
        transactions: formattedTransactions,
        totalExpenses: expenses.length,
        recentPayment: { from, to, amount: numAmount },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { paySettlement };

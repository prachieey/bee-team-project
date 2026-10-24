// controllers/groupExpenseController.js
// Group expense CRUD + settlement calculation
// Demonstrates: populate, splitEngine, settlementEngine integration (Lecture 43-48)

const Group        = require('../models/Group');
const GroupExpense = require('../models/GroupExpense');
const { splitEqually, splitCustom }               = require('../utils/splitEngine');
const { calculateNetBalances, computeSettlement } = require('../utils/settlementEngine');

// ── Helper: verify caller is a group member ─────────────────────────────────
const assertMember = (group, userId) => {
  const targetId = userId.toString();
  const isMember = group.members.some((m) => {
    const id = (m._id || m).toString();
    return id === targetId;
  });
  if (!isMember) {
    const err = new Error('Not authorized. You are not a member of this group.');
    err.statusCode = 403;
    throw err;
  }
};

// ── GET /api/groups/:id/expenses ─────────────────────────────────────────────
const getGroupExpenses = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    assertMember(group, req.user._id);

    const expenses = await GroupExpense.find({ groupId: req.params.id })
      .populate('paidBy',             'name email')
      .populate('participants.userId', 'name email')
      .populate('createdBy',          'name email')
      .sort({ date: -1, createdAt: -1 });

    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/groups/:id/expenses ────────────────────────────────────────────
const createGroupExpense = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    assertMember(group, req.user._id);

    const {
      title,
      totalAmount,
      paidBy,
      participantIds,
      memberIds,
      splitType = 'equal',
      customShares,
      date,
      receiptImage,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Expense title is required.' });
    }

    const numAmount = Number(totalAmount);
    if (!totalAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Total amount must be greater than 0.' });
    }

    if (!paidBy) {
      return res.status(400).json({ success: false, message: 'Payer is required.' });
    }

    // Validate paidBy is a group member
    const payerId = (paidBy && paidBy._id) ? paidBy._id.toString() : paidBy.toString();
    const payerIsMember = group.members.some((m) => (m._id || m).toString() === payerId);
    if (!payerIsMember) {
      return res.status(400).json({ success: false, message: 'Payer must be a member of this group.' });
    }

    // Resolve participants list
    const pIds = participantIds || memberIds;
    if (!pIds || !Array.isArray(pIds) || pIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one participant is required.' });
    }

    // Validate each participant is in group
    for (const pid of pIds) {
      const pidStr = (pid && pid._id) ? pid._id.toString() : pid.toString();
      const ok = group.members.some((m) => (m._id || m).toString() === pidStr);
      if (!ok) {
        return res.status(400).json({ success: false, message: `Participant ${pidStr} is not a member of this group.` });
      }
    }

    // Calculate shares using splitEngine
    let participants;
    if (splitType === 'equal') {
      const splits = splitEqually(numAmount, pIds.map((p) => (p._id || p).toString()));
      participants = splits.map((s) => ({ userId: s.userId, share: s.share }));
    } else if (splitType === 'custom') {
      if (!customShares || typeof customShares !== 'object') {
        return res.status(400).json({ success: false, message: 'customShares object is required for custom split.' });
      }
      const shareMap = {};
      pIds.forEach((pid) => {
        const idStr = (pid && pid._id) ? pid._id.toString() : pid.toString();
        if (customShares[idStr] === undefined) {
          throw Object.assign(new Error(`Share missing for participant ${idStr}`), { statusCode: 400 });
        }
        shareMap[idStr] = Number(customShares[idStr]);
      });
      const splits = splitCustom(numAmount, shareMap);
      participants = splits.map((s) => ({ userId: s.userId, share: s.share }));
    } else {
      return res.status(400).json({ success: false, message: 'splitType must be "equal" or "custom".' });
    }

    const expense = await GroupExpense.create({
      groupId:     req.params.id,
      title:       title.trim(),
      totalAmount: numAmount,
      paidBy:      payerId,
      participants,
      splitType,
      date:        date ? new Date(date) : new Date(),
      createdBy:   req.user._id,
      receiptImage: req.file ? req.file.filename : (receiptImage || null),
    });

    const populated = await GroupExpense.findById(expense._id)
      .populate('paidBy',             'name email')
      .populate('participants.userId', 'name email')
      .populate('createdBy',          'name email');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/groups/:id/expenses/:expenseId ──────────────────────────────────
const updateGroupExpense = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    assertMember(group, req.user._id);

    const expense = await GroupExpense.findById(req.params.expenseId);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });
    if (expense.groupId.toString() !== req.params.id) {
      return res.status(400).json({ success: false, message: 'Expense does not belong to this group.' });
    }

    // Only expense creator can update it
    if (expense.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the expense creator can edit it.' });
    }

    const {
      title,
      totalAmount,
      paidBy,
      participantIds,
      memberIds,
      splitType,
      customShares,
      date,
      receiptImage,
    } = req.body;

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Expense title cannot be empty.' });
      }
      expense.title = title.trim();
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date.' });
      }
      expense.date = parsedDate;
    }

    if (paidBy !== undefined) {
      const payerId = (paidBy && paidBy._id) ? paidBy._id.toString() : paidBy.toString();
      const payerIsMember = group.members.some((m) => (m._id || m).toString() === payerId);
      if (!payerIsMember) {
        return res.status(400).json({ success: false, message: 'Payer must be a member of this group.' });
      }
      expense.paidBy = payerId;
    }

    if (req.file) {
      expense.receiptImage = req.file.filename;
    } else if (receiptImage !== undefined) {
      expense.receiptImage = receiptImage;
    }

    const effectiveSplitType = splitType || expense.splitType;
    expense.splitType = effectiveSplitType;

    const pIds = participantIds || memberIds;
    const targetAmount = totalAmount !== undefined ? Number(totalAmount) : expense.totalAmount;

    if (totalAmount !== undefined || pIds !== undefined) {
      if (isNaN(targetAmount) || targetAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Total amount must be greater than 0.' });
      }
      expense.totalAmount = targetAmount;

      const activeParticipantIds = pIds
        ? pIds.map((p) => (p._id || p).toString())
        : expense.participants.map((p) => (p.userId?._id || p.userId).toString());

      if (!activeParticipantIds || activeParticipantIds.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one participant is required.' });
      }

      // Check all participants belong to group
      for (const pid of activeParticipantIds) {
        const ok = group.members.some((m) => (m._id || m).toString() === pid);
        if (!ok) {
          return res.status(400).json({ success: false, message: `Participant ${pid} is not a member of this group.` });
        }
      }

      let participants;
      if (effectiveSplitType === 'equal') {
        const splits = splitEqually(targetAmount, activeParticipantIds);
        participants = splits.map((s) => ({ userId: s.userId, share: s.share }));
      } else if (effectiveSplitType === 'custom') {
        if (!customShares || typeof customShares !== 'object') {
          return res.status(400).json({ success: false, message: 'customShares object is required for custom split.' });
        }
        const shareMap = {};
        activeParticipantIds.forEach((pid) => {
          if (customShares[pid] === undefined) {
            throw Object.assign(new Error(`Share missing for participant ${pid}`), { statusCode: 400 });
          }
          shareMap[pid] = Number(customShares[pid]);
        });
        const splits = splitCustom(targetAmount, shareMap);
        participants = splits.map((s) => ({ userId: s.userId, share: s.share }));
      } else {
        return res.status(400).json({ success: false, message: 'splitType must be "equal" or "custom".' });
      }

      expense.participants = participants;
    }

    await expense.save();

    const populated = await GroupExpense.findById(expense._id)
      .populate('paidBy',             'name email')
      .populate('participants.userId', 'name email')
      .populate('createdBy',          'name email');

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/groups/:id/expenses/:expenseId ───────────────────────────────
const deleteGroupExpense = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    assertMember(group, req.user._id);

    const expense = await GroupExpense.findById(req.params.expenseId);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });

    if (expense.groupId.toString() !== req.params.id) {
      return res.status(400).json({ success: false, message: 'Expense does not belong to this group.' });
    }

    // Only expense creator or group admin can delete
    const isCreator = expense.createdBy.toString() === req.user._id.toString();
    const isGroupAdmin = group.createdBy.toString() === req.user._id.toString();
    if (!isCreator && !isGroupAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this expense.' });
    }

    await expense.deleteOne();

    res.json({ success: true, message: 'Group expense deleted.' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/groups/:id/settlement ──────────────────────────────────────────
// Returns net balances and optimal repayment plan from real stored data
const getSettlement = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email');

    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    assertMember(group, req.user._id);

    const expenses = await GroupExpense.find({ groupId: req.params.id })
      .populate('paidBy',             'name email')
      .populate('participants.userId', 'name email');

    // Build memberIds array (strings for the engine)
    const memberIds = group.members.map((m) => (m._id || m).toString());

    // Calculate net balances using ported settlement engine
    const balances = calculateNetBalances(expenses, memberIds);

    // Map userId → name for display
    const userMap = {};
    group.members.forEach((m) => {
      userMap[(m._id || m).toString()] = m.name || m.email;
    });

    // Compute minimal transactions
    const transactions = computeSettlement(balances);

    // Format balances for response (include user names)
    const formattedBalances = Object.entries(balances).map(([uid, amount]) => ({
      userId: uid,
      name:   userMap[uid] || uid,
      amount: Math.round(amount * 100) / 100,
      status: amount > 0.005 ? 'creditor' : amount < -0.005 ? 'debtor' : 'settled',
    }));

    // Format transactions with names
    const formattedTransactions = transactions.map((t) => ({
      from:       t.from,
      fromName:   userMap[t.from] || t.from,
      to:         t.to,
      toName:     userMap[t.to]   || t.to,
      amount:     t.amount,
    }));

    res.json({
      success: true,
      data: {
        group:          { _id: group._id, name: group.name },
        netBalances:    balances,
        balances:       formattedBalances,
        settlementPlan: formattedTransactions,
        transactions:   formattedTransactions,
        totalExpenses:  expenses.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGroupExpenses,
  createGroupExpense,
  updateGroupExpense,
  deleteGroupExpense,
  getSettlement,
};

// controllers/dashboardController.js
// Dashboard summary – aggregated from real Transaction records
// Demonstrates: MongoDB aggregation pipeline, reduce, filter (Lecture 44-45)

const Transaction = require('../models/Transaction');

// ── GET /api/dashboard/summary ───────────────────────────────────────────────
const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Aggregation pipeline: group by type to get total income and total expense
    const totals = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id:         '$type',
          total:       { $sum: '$amount' },
          count:       { $sum: 1 },
        },
      },
    ]);

    // Parse aggregation result into a simple object
    let totalIncome  = 0;
    let totalExpense = 0;
    let incomeCount  = 0;
    let expenseCount = 0;

    totals.forEach(({ _id, total, count }) => {
      if (_id === 'income')  { totalIncome  = total; incomeCount  = count; }
      if (_id === 'expense') { totalExpense = total; expenseCount = count; }
    });

    const balance = totalIncome - totalExpense;

    // Category-wise expense breakdown
    const categoryBreakdown = await Transaction.aggregate([
      { $match: { userId, type: 'expense' } },
      {
        $group: {
          _id:   '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } }, // Sort by highest spend first
    ]);

    // Monthly summary for the current year
    const currentYear = new Date().getFullYear();
    const monthlySummary = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id:     { month: { $month: '$date' }, type: '$type' },
          total:   { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // Recent 5 transactions (newest first)
    const recentTransactions = await Transaction.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance,
        totals: {
          income: totalIncome,
          expense: totalExpense,
          balance,
        },
        incomeCount,
        expenseCount,
        categoryBreakdown: categoryBreakdown.map(({ _id, total, count }) => ({
          _id,
          category: _id,
          total,
          count,
        })),
        monthlySummary,
        recentTransactions,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardSummary };

// controllers/transactionController.js
// Personal transaction CRUD
// Demonstrates: Mongoose CRUD, async/await, authorization checks (Lecture 43-45)

const Transaction = require('../models/Transaction');

// ── GET /api/transactions ────────────────────────────────────────────────────
// Supports query params: type, category, search, sortBy, sortOrder, startDate, endDate
const getTransactions = async (req, res, next) => {
  try {
    const { type, category, search, sortBy = 'date', sortOrder = 'desc', startDate, endDate } = req.query;

    // Build filter object – always scoped to authenticated user
    const filter = { userId: req.user._id };

    if (type && ['income', 'expense'].includes(type)) filter.type = type;
    if (category) filter.category = category;
    if (search && search.trim()) {
      filter.description = { $regex: search.trim(), $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const sd = new Date(startDate);
        if (!isNaN(sd.getTime())) filter.date.$gte = sd;
      }
      if (endDate) {
        const ed = new Date(endDate);
        if (!isNaN(ed.getTime())) filter.date.$lte = ed;
      }
    }

    // Build sort object
    const validSortFields = ['date', 'amount', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'date';
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    const transactions = await Transaction.find(filter).sort(sort);

    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/transactions ───────────────────────────────────────────────────
const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, description, date } = req.body;

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number greater than 0.' });
    }

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be income or expense.' });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required.' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Valid date is required.' });
    }

    const txn = await Transaction.create({
      userId:      req.user._id,
      type,
      amount:      numAmount,
      category:    category.trim(),
      description: description ? description.trim() : '',
      date:        parsedDate,
    });

    res.status(201).json({ success: true, data: txn });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/transactions/:id ────────────────────────────────────────────────
const getTransaction = async (req, res, next) => {
  try {
    const txn = await Transaction.findById(req.params.id);

    if (!txn) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    // Authorization: only the owner can view
    if (txn.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    res.json({ success: true, data: txn });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/transactions/:id ────────────────────────────────────────────────
const updateTransaction = async (req, res, next) => {
  try {
    let txn = await Transaction.findById(req.params.id);

    if (!txn) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    if (txn.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this transaction.' });
    }

    const { type, amount, category, description, date } = req.body;

    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a positive number greater than 0.' });
      }
      txn.amount = numAmount;
    }

    if (type !== undefined) {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Type must be income or expense.' });
      }
      txn.type = type;
    }

    if (category !== undefined) {
      if (!category || !category.trim()) {
        return res.status(400).json({ success: false, message: 'Category is required.' });
      }
      txn.category = category.trim();
    }

    if (description !== undefined) {
      txn.description = description ? description.trim() : '';
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Valid date is required.' });
      }
      txn.date = parsedDate;
    }

    await txn.save(); // Triggers Mongoose schema validation

    res.json({ success: true, data: txn });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/transactions/:id ─────────────────────────────────────────────
const deleteTransaction = async (req, res, next) => {
  try {
    const txn = await Transaction.findById(req.params.id);

    if (!txn) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    if (txn.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await txn.deleteOne();

    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTransactions, createTransaction, getTransaction, updateTransaction, deleteTransaction };

// models/Transaction.js
// Personal income/expense transaction schema
// Demonstrates: ObjectId references, enum validation, Mongoose indexes (Lecture 43-44)

const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Transport',
  'Shopping',
  'Health',
  'Education',
  'Entertainment',
  'Utilities',
  'Bills',
  'Other',
];

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Gift',
  'Gifts',
  'Investment',
  'Investments',
  'Other',
];

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: { values: ['income', 'expense'], message: 'Type must be income or expense' },
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      validate: {
        validator(value) {
          const all = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
          return all.includes(value);
        },
        message: 'Invalid category',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user+date queries
TransactionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);

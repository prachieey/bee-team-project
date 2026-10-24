// models/GroupExpense.js
// Group expense with per-participant share breakdown
// Demonstrates: Nested schema, ObjectId refs, Mongoose validation (Lecture 43-44)
//
// ACCOUNTING MODEL NOTE:
// Group expenses are stored separately from personal Transactions.
// The dashboard shows ONLY personal Transaction records (income/expense).
// Group balances (who owes whom) are calculated exclusively from GroupExpense
// records and displayed on the Settlement page.
// This prevents double-counting a group meal as both a "group expense" and
// a personal "expense" transaction.

const mongoose = require('mongoose');

// Sub-schema: one participant's share within a group expense
const ParticipantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    share: {
      type: Number,
      required: true,
      min: [0, 'Share cannot be negative'],
    },
  },
  { _id: false } // No separate _id for sub-documents
);

const GroupExpenseSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payer is required'],
    },
    participants: {
      type: [ParticipantSchema],
      validate: {
        validator(arr) {
          return arr && arr.length > 0;
        },
        message: 'At least one participant is required',
      },
    },
    splitType: {
      type: String,
      enum: ['equal', 'custom'],
      default: 'equal',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Optional: receipt image filename (uploaded via Multer)
    receiptImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Validate that participant shares sum to totalAmount (within 1 paise tolerance)
GroupExpenseSchema.pre('save', function (next) {
  const total = this.participants.reduce((sum, p) => sum + p.share, 0);
  const diff = Math.abs(total - this.totalAmount);
  if (diff > 0.02) {
    return next(
      new Error(
        `Participant shares (${total.toFixed(2)}) must sum to total amount (${this.totalAmount.toFixed(2)})`
      )
    );
  }
  next();
});

module.exports = mongoose.model('GroupExpense', GroupExpenseSchema);

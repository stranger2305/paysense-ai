const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    // Which user owns this transaction
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Transaction amount
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },

    // Credit = money coming in, Debit = money going out
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: [true, 'Transaction type is required'],
    },

    // AI-assigned category
    category: {
      type: String,
      enum: [
        'food',
        'transport',
        'shopping',
        'entertainment',
        'healthcare',
        'education',
        'utilities',
        'rent',
        'salary',
        'investment',
        'transfer',
        'cash',
        'other',
      ],
      default: 'other',
    },

    // Original description from bank statement
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Clean readable title (AI generated)
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    // When did this transaction happen
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },

    // Where did this transaction come from
    source: {
      type: String,
      enum: ['bank_statement', 'manual', 'cash_journal'],
      default: 'manual',
    },

    // Bank name if from statement
    bankName: {
      type: String,
      trim: true,
      default: null,
    },

    // UPI/Reference ID from bank
    referenceId: {
      type: String,
      trim: true,
      default: null,
    },

    // Is this a cash transaction?
    isCash: {
      type: Boolean,
      default: false,
    },

    // User can add personal notes
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: null,
    },

    // AI confidence score for category assignment (0-1)
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    // Which statement this came from
    statement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Statement',
      default: null,
    },

    // For family hub — which family member
    familyMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Tags for custom filtering
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ---- INDEXES for fast querying ----
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, date: -1, category: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
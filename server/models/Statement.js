const mongoose = require('mongoose');

const statementSchema = new mongoose.Schema(
  {
    // Which user uploaded this
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Bank name detected from PDF
    bankName: {
      type: String,
      trim: true,
      default: 'Unknown Bank',
    },

    // Statement period
    periodStart: {
      type: Date,
      default: null,
    },

    periodEnd: {
      type: Date,
      default: null,
    },

    // Processing status
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
      default: 'uploaded',
    },

    // How many transactions were extracted
    transactionCount: {
      type: Number,
      default: 0,
    },

    // Total credits and debits from this statement
    totalCredits: {
      type: Number,
      default: 0,
    },

    totalDebits: {
      type: Number,
      default: 0,
    },

    // Original filename
    fileName: {
      type: String,
      trim: true,
    },

    // Error message if processing failed
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Statement = mongoose.model('Statement', statementSchema);
module.exports = Statement;
const mongoose = require('mongoose');

const cashJournalSchema = new mongoose.Schema(
  {
    // Which user owns this entry
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ATM withdrawal amount that triggered this journal
    atmWithdrawalAmount: {
      type: Number,
      required: true,
    },

    // How the cash was actually spent (user fills this in)
    entries: [
      {
        description: {
          type: String,
          required: true,
          trim: true,
        },
        amount: {
          type: Number,
          required: true,
        },
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
            'other',
          ],
          default: 'other',
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Total accounted for vs withdrawn
    totalAccounted: {
      type: Number,
      default: 0,
    },

    // Is all the cash accounted for?
    isFullyAccounted: {
      type: Boolean,
      default: false,
    },

    // Date of the ATM withdrawal
    withdrawalDate: {
      type: Date,
      required: true,
    },

    // Linked to the original ATM transaction
    linkedTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const CashJournal = mongoose.model('CashJournal', cashJournalSchema);
module.exports = CashJournal;
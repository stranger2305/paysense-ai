const Transaction = require('../models/Transaction');
const CashJournal = require('../models/CashJournal');

// -----------------------------------------------
// @desc    Get all transactions for logged in user
// @route   GET /api/transactions
// @access  Private
// -----------------------------------------------
const getTransactions = async (req, res) => {
  try {
    const {
      category,
      type,
      startDate,
      endDate,
      source,
      page = 1,
      limit = 20,
    } = req.query;

    // Build filter dynamically
    const filter = { user: req.user.id };

    if (category) filter.category = category;
    if (type) filter.type = type;
    if (source) filter.source = source;          // ✅ Fixed: was 'Source' (capital S)
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);  // ✅ Fixed: was 'StartDate'
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),                          // ✅ Fixed: was '-v' (missing underscore)
      Transaction.countDocuments(filter),         // ✅ Fixed: was 'Transaction,countDocuments' (comma instead of dot)
    ]);

    res.status(200).json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' }); // ✅ Fixed: was 'Errorfetching'
  }
};

// -----------------------------------------------
// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
// -----------------------------------------------
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ transaction });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching transaction' });
  }
};

// -----------------------------------------------
// @desc    Create a manual transaction
// @route   POST /api/transactions
// @access  Private
// -----------------------------------------------
const createTransaction = async (req, res) => {  // ✅ Fixed: was 'Req' (capital R)
  try {
    const {
      amount,
      type,
      category,
      description,
      date,
      notes,
      isCash,
    } = req.body;

    // Validate required fields
    if (!amount || !type || !description || !date) {
      return res.status(400).json({
        message: 'Please provide amount, type, description and date',
      });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      amount,
      type,
      category: category || 'other',
      description,
      title: description.slice(0, 50),
      date: new Date(date),
      notes,
      isCash: isCash || false,                   // ✅ Fixed: was 'iscash' (lowercase c)
      source: 'manual',
    });

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction,                                // ✅ Fixed: was 'tranasction' (typo)
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages[0] });
    }
    res.status(500).json({ message: 'Error creating transaction' });
  }
};

// -----------------------------------------------
// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
// -----------------------------------------------
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const { category, notes, title, description } = req.body;

    if (category) transaction.category = category;
    if (notes) transaction.notes = notes;
    if (title) transaction.title = title;
    if (description) transaction.description = description;

    const updatedTransaction = await transaction.save();

    res.status(200).json({
      message: 'Transaction updated successfully',
      transaction: updatedTransaction,
    });

  } catch (error) {
    res.status(500).json({ message: 'Error updating transaction' });
  }
};

// -----------------------------------------------
// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
// -----------------------------------------------
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ message: 'Transaction deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction' });
  }
};

// -----------------------------------------------
// @desc    Get dashboard stats
// @route   GET /api/transactions/stats
// @access  Private
// -----------------------------------------------
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Run all queries in parallel
    const [
      thisMonthTotals,
      lastMonthTotals,
      categoryBreakdown,
      recentTransactions,
      cashJournals,
    ] = await Promise.all([

      // This month totals
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // Last month totals
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),

      // Category breakdown this month
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: startOfMonth },
            type: 'debit',
          },
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 6 },
      ]),

      // Recent 5 transactions
      Transaction.find({ user: req.user.id })
        .sort({ date: -1 })
        .limit(5)
        .select('title description amount type category date'),

      // Pending cash journals
      CashJournal.find({                          // ✅ Fixed: was 'cashJournal' (lowercase c)
        user: req.user.id,
        isFullyAccounted: false,
      }).countDocuments(),
    ]);

    // Process this month data
    const thisMonthCredits = thisMonthTotals.find((t) => t._id === 'credit')?.total || 0;
    const thisMonthDebits = thisMonthTotals.find((t) => t._id === 'debit')?.total || 0;

    // Process last month data
    const lastMonthCredits = lastMonthTotals.find((t) => t._id === 'credit')?.total || 0;
    const lastMonthDebits = lastMonthTotals.find((t) => t._id === 'debit')?.total || 0;

    // Calculate percentage changes
    const spendingChange = lastMonthDebits > 0
      ? (((thisMonthDebits - lastMonthDebits) / lastMonthDebits) * 100).toFixed(1)
      : 0;

    const savingsChange = lastMonthCredits > 0
      ? (((thisMonthCredits - lastMonthCredits) / lastMonthCredits) * 100).toFixed(1)
      : 0;

    res.status(200).json({
      thisMonth: {
        credits: thisMonthCredits,
        debits: thisMonthDebits,
        savings: thisMonthCredits - thisMonthDebits,
      },
      lastMonth: {
        credits: lastMonthCredits,
        debits: lastMonthDebits,
        savings: lastMonthCredits - lastMonthDebits,
      },
      changes: {
        spending: parseFloat(spendingChange),
        savings: parseFloat(savingsChange),
      },
      categoryBreakdown,
      recentTransactions,
      pendingCashJournals: cashJournals,
    });

  } catch (error) {
    console.error('DASHBOARD STATS ERROR:', error);   // ✅ Fixed: was 'DASHBORAD'
    res.status(500).json({ message: 'Error fetching dashboard stats' }); // ✅ Fixed: was 'dahsboard'
  }
};

// -----------------------------------------------
// @desc    Get monthly trend data for charts
// @route   GET /api/transactions/trends
// @access  Private
// -----------------------------------------------
const getMonthlyTrends = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trends = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formattedTrends = {};
    trends.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      if (!formattedTrends[key]) {
        formattedTrends[key] = {
          month: monthNames[item._id.month - 1],
          credits: 0,
          debits: 0,
        };
      }
      if (item._id.type === 'credit') {
        formattedTrends[key].credits = item.total;
      } else {
        formattedTrends[key].debits = item.total;
      }
    });

    res.status(200).json({
      trends: Object.values(formattedTrends),
    });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching trends' });
  }
};

// -----------------------------------------------
// @desc    Add entry to cash journal
// @route   POST /api/transactions/cash-journal/:id
// @access  Private
// -----------------------------------------------
const addCashJournalEntry = async (req, res) => {
  try {
    const { description, amount, category } = req.body;

    if (!description || !amount) {
      return res.status(400).json({
        message: 'Please provide description and amount',
      });
    }

    const journal = await CashJournal.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!journal) {
      return res.status(404).json({ message: 'Cash journal not found' });
    }

    journal.entries.push({
      description,
      amount,
      category: category || 'other',
      date: new Date(),
    });

    journal.totalAccounted = journal.entries.reduce(
      (sum, entry) => sum + entry.amount, 0
    );

    journal.isFullyAccounted =
      journal.totalAccounted >= journal.atmWithdrawalAmount;

    await journal.save();

    res.status(200).json({
      message: 'Cash journal entry added',
      journal,
    });

  } catch (error) {
    res.status(500).json({ message: 'Error adding cash journal entry' });
  }
};

// -----------------------------------------------
// @desc    Get all cash journals for user
// @route   GET /api/transactions/cash-journals
// @access  Private
// -----------------------------------------------
const getCashJournals = async (req, res) => {
  try {
    const journals = await CashJournal.find({ user: req.user.id })
      .sort({ withdrawalDate: -1 })
      .populate('linkedTransaction', 'amount date description');

    res.status(200).json({ journals });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching cash journals' });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getDashboardStats,
  getMonthlyTrends,
  addCashJournalEntry,
  getCashJournals,
};
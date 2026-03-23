const Statement = require('../models/Statement');
const Transaction = require('../models/Transaction');
const CashJournal = require('../models/CashJournal');
const { parseBankStatement } = require('../utils/pdfParser');
const { categorizeTransactions, isATMWithdrawal } = require('../utils/categorizer');

// -----------------------------------------------
// @desc    Upload and parse a bank statement PDF
// @route   POST /api/statements/upload
// @access  Private
// -----------------------------------------------
const uploadStatement = async (req, res) => {
  try {
    // Step 1 — Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    // Step 2 — Create a statement record with 'processing' status
    const statement = await Statement.create({
      user: req.user.id,
      status: 'processing',
      fileName: req.file.originalname,
    });

    // Step 3 — Parse the PDF using our utility
    const parsedData = await parseBankStatement(req.file.buffer);

    // Step 4 — Categorize all transactions using our categorizer
    const categorizedTransactions = categorizeTransactions(parsedData.transactions);

    // Step 5 — Save all transactions to database
    const transactionsToSave = categorizedTransactions.map((t) => ({
      user: req.user.id,
      amount: t.amount,
      type: t.type,
      category: t.category,
      description: t.description,
      title: generateTitle(t.description),
      date: t.date,
      source: 'bank_statement',
      bankName: parsedData.bankName,
      aiConfidence: t.aiConfidence,
      statement: statement._id,
      isCash: isATMWithdrawal(t.description),
    }));

    // Step 6 — Bulk insert all transactions at once
    const savedTransactions = await Transaction.insertMany(transactionsToSave);

    // Step 7 — Find ATM withdrawals and create Cash Journal entries
    const atmTransactions = savedTransactions.filter((t) => t.isCash);
    for (const atmTx of atmTransactions) {
      await CashJournal.create({
        user: req.user.id,
        atmWithdrawalAmount: atmTx.amount,
        withdrawalDate: atmTx.date,
        linkedTransaction: atmTx._id,
        entries: [],
        totalAccounted: 0,
        isFullyAccounted: false,
      });
    }

    // Step 8 — Calculate totals
    const totalCredits = savedTransactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDebits = savedTransactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    // Step 9 — Update statement with results
    await Statement.findByIdAndUpdate(statement._id, {
      status: 'completed',
      bankName: parsedData.bankName,
      periodStart: parsedData.periodStart,
      periodEnd: parsedData.periodEnd,
      transactionCount: savedTransactions.length,
      totalCredits,
      totalDebits,
    });

    // Step 10 — Send response
    res.status(201).json({
      message: 'Statement processed successfully',
      statement: {
        _id: statement._id,
        bankName: parsedData.bankName,
        transactionCount: savedTransactions.length,
        totalCredits,
        totalDebits,
        atmWithdrawalsFound: atmTransactions.length,
      },
    });

  } catch (error) {
    console.error('STATEMENT UPLOAD ERROR:', error);

    // Update statement status to failed if it was created
    if (req.statementId) {
      await Statement.findByIdAndUpdate(req.statementId, {
        status: 'failed',
        errorMessage: error.message,
      });
    }

    res.status(500).json({ message: `Statement processing failed: ${error.message}` });
  }
};

// -----------------------------------------------
// @desc    Get all statements for logged in user
// @route   GET /api/statements
// @access  Private
// -----------------------------------------------
const getStatements = async (req, res) => {
  try {
    const statements = await Statement.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({ statements });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statements' });
  }
};

// -----------------------------------------------
// @desc    Get all transactions for logged in user
// @route   GET /api/statements/transactions
// @access  Private
// -----------------------------------------------
const getTransactions = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { category, type, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Build filter object dynamically
    const filter = { user: req.user.id };

    if (category) filter.category = category;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Run query and count in parallel
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      Transaction.countDocuments(filter),
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
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

// -----------------------------------------------
// @desc    Get spending summary for dashboard
// @route   GET /api/statements/summary
// @access  Private
// -----------------------------------------------
const getSpendingSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);

    // MongoDB Aggregation Pipeline
    const summary = await Transaction.aggregate([
      // Stage 1 — Filter by user and date range
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      // Stage 2 — Group by category and calculate totals
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
      // Stage 3 — Sort by total spending descending
      {
        $sort: { total: -1 },
      },
      // Stage 4 — Rename _id to category for clarity
      {
        $project: {
          category: '$_id',
          total: 1,
          count: 1,
          avgAmount: { $round: ['$avgAmount', 2] },
          _id: 0,
        },
      },
    ]);

    // Calculate overall totals
    const totals = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const totalCredits = totals.find((t) => t._id === 'credit')?.total || 0;
    const totalDebits = totals.find((t) => t._id === 'debit')?.total || 0;

    res.status(200).json({
      summary,
      totalCredits,
      totalDebits,
      netSavings: totalCredits - totalDebits,
      month: targetMonth + 1,
      year: targetYear,
    });

  } catch (error) {
    res.status(500).json({ message: 'Error generating spending summary' });
  }
};

// -----------------------------------------------
// Helper — Generate clean title from description
// -----------------------------------------------
const generateTitle = (description) => {
  // Extract merchant name from UPI/NEFT descriptions
  // Example: "UPI/SWIGGY/ORDER123/YBL" → "Swiggy"
  const upiPattern = /UPI[\/\-]([A-Za-z]+)/i;
  const upiMatch = description.match(upiPattern);
  if (upiMatch) {
    return upiMatch[1].charAt(0).toUpperCase() + upiMatch[1].slice(1).toLowerCase();
  }

  // Take first 3 words as title
  const words = description.split(/\s+/).slice(0, 3).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
};

module.exports = {
  uploadStatement,
  getStatements,
  getTransactions,
  getSpendingSummary,
};
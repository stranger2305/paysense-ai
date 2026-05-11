const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getDashboardStats,
  getMonthlyTrends,
  addCashJournalEntry,
  getCashJournals,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// All routes protected
router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/trends', getMonthlyTrends);
router.get('/cash-journals', getCashJournals);
router.post('/cash-journal/:id', addCashJournalEntry);

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.route('/:id')
  .get(getTransactionById)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
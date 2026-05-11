const express = require('express');
const router = express.Router();
const {
  uploadStatement,
  getStatements,
  getTransactions,
  getSpendingSummary,
} = require('../controllers/statementController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// All routes are protected
router.use(protect);

router.post('/upload', upload.single('statement'), uploadStatement);
router.get('/', getStatements);
router.get('/transactions', getTransactions);
router.get('/summary', getSpendingSummary);

module.exports = router;
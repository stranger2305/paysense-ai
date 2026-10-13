const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    chatWithAICoach,
    getSpendingAnalysis,
    getBudgetRecommendation,
    getFinancialHealthScore,
} = require('../controllers/aiController');

const router = express.Router();

router.post('/chat', protect, chatWithAICoach);
router.get('/spending-analysis', protect, getSpendingAnalysis);
router.get('/budget-recommendation', protect, getBudgetRecommendation);
router.get('/health-score', protect, getFinancialHealthScore);

module.exports = router;
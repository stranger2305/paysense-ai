const express = require('express');
const router = express.Router();
const {
  createFamilyGroup,
  joinFamilyGroup,
  getFamilyDashboard,
  leaveFamilyGroup,
} = require('../controllers/familyController');
const { protect } = require('../middleware/authMiddleware');

// All routes protected — must be logged in
router.use(protect);

router.post('/create', createFamilyGroup);
router.post('/join', joinFamilyGroup);
router.get('/dashboard', getFamilyDashboard);
router.post('/leave', leaveFamilyGroup);

module.exports = router;
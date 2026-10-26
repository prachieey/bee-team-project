// routes/groups.js
const express = require('express');
const router  = express.Router();
const { getGroups, createGroup, getGroup, updateGroup, deleteGroup } = require('../controllers/groupController');
const { paySettlement } = require('../controllers/settlementController');
const {
  getGroupExpenses,
  createGroupExpense,
  updateGroupExpense,
  deleteGroupExpense,
  getSettlement,
} = require('../controllers/groupExpenseController');
const { protect } = require('../middleware/auth');
const upload      = require('../services/uploadService');

router.use(protect); // All group routes require authentication

// Group CRUD
router.route('/').get(getGroups).post(createGroup);
router.route('/:id').get(getGroup).put(updateGroup).delete(deleteGroup);

// Group expenses (nested under group) with optional receipt image upload via Multer
router
  .route('/:id/expenses')
  .get(getGroupExpenses)
  .post(upload.single('receipt'), createGroupExpense);

router
  .route('/:id/expenses/:expenseId')
  .put(upload.single('receipt'), updateGroupExpense)
  .delete(deleteGroupExpense);

// Settlement calculation
router.get('/:id/settlement', getSettlement);
router.post('/:id/settlement/pay', paySettlement);

module.exports = router;

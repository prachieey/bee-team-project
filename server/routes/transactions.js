// routes/transactions.js
const express = require('express');
const router  = express.Router();
const {
  getTransactions, createTransaction, getTransaction,
  updateTransaction, deleteTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.use(protect); // All transaction routes require authentication

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.route('/:id')
  .get(getTransaction)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;

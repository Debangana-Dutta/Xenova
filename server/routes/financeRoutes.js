const express = require('express');
const router = express.Router();
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getFinanceSummary,
} = require('../controllers/financeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', getFinanceSummary);

router.route('/transactions').get(getTransactions).post(createTransaction);

router.route('/transactions/:id').put(updateTransaction).delete(deleteTransaction);

module.exports = router;

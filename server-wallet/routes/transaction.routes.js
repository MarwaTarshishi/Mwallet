const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const TransactionController = require('../controllers/transaction.controller');

router.use(auth); // Protect all transaction routes

router.get('/', TransactionController.getAllTransactions);
router.get('/summary', TransactionController.getTransactionSummary);
router.get('/:id', TransactionController.getTransactionById);
router.post('/', TransactionController.createTransaction);

module.exports = router;


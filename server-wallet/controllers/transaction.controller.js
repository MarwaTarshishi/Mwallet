const Transaction = require('../models/transaction.model');
const { validateTransaction } = require('../utils/validators');

class TransactionController {
    static async getAllTransactions(req, res) {
        try {
            const userId = req.userData.userId;
            const transactions = await Transaction.findByUserId(userId, req.query);
            
            const summary = await Transaction.getSummary(userId);
            
            res.json({
                success: true,
                data: transactions,
                summary: {
                    totalCount: summary.total_count,
                    totalDeposits: summary.total_deposits || 0,
                    totalWithdrawals: summary.total_withdrawals || 0,
                    netBalance: (summary.total_deposits || 0) - (summary.total_withdrawals || 0)
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching transactions',
                error: error.message
            });
        }
    }

    static async createTransaction(req, res) {
        try {
            const validation = validateTransaction(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid transaction data',
                    errors: validation.errors
                });
            }

            const transaction = await Transaction.create({
                ...req.body,
                user_id: req.userData.userId
            });

            res.status(201).json({
                success: true,
                message: 'Transaction created successfully',
                data: transaction
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating transaction',
                error: error.message
            });
        }
    }
}

module.exports = TransactionController;

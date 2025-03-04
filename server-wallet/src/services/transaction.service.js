import api from './api';

class TransactionService {
    async getAllTransactions(filters = {}) {
        try {
            const response = await api.get('/transaction', { params: filters });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async createTransaction(transactionData) {
        try {
            const response = await api.post('/transaction', transactionData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getWalletBalance() {
        try {
            const response = await api.get('/wallet/balance');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default new TransactionService();


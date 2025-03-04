import api from './api';

class TransactionService {
    async getAllTransactions(params) {
        try {
            const response = await api.get('/transaction', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getTransactionById(id) {
        try {
            const response = await api.get(`/transaction/${id}`);
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

    async getTransactionSummary() {
        try {
            const response = await api.get('/transaction/summary');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default new TransactionService();

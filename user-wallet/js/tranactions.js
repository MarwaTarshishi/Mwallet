class TransactionManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            type: '',
            status: '',
            search: '',
            dateRange: 'all',
            startDate: null,
            endDate: null
        };
        this.init();
    }

    async init() {
        if (!this.checkAuth()) return;
        await this.loadTransactions();
        this.initializeEventListeners();
        this.updateUserInfo();
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = './login.html';
            return false;
        }
        return true;
    }

    updateUserInfo() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        document.getElementById('userFullName').textContent = user.fullName || 'User';
    }

    async loadTransactions() {
        try {
            this.showLoading(true);
            // Simulated API call - replace with actual API endpoint
            const transactions = [
                {
                    id: 'TXN001',
                    date: '2024-01-20 14:30:45',
                    reference: 'DEP20240120ABC123',
                    type: 'deposit',
                    description: 'Initial deposit',
                    amount: 500.00,
                    status: 'completed'
                },
                {
                    id: 'TXN002',
                    date: '2024-01-19 09:15:22',
                    reference: 'WDR20240119DEF456',
                    type: 'withdrawal',
                    description: 'ATM withdrawal',
                    amount: -100.00,
                    status: 'completed'
                },
                // Add more sample transactions as needed
            ];

            this.renderTransactions(transactions);
            this.updateSummary(transactions);
        } catch (error) {
            this.showToast('error', 'Failed to load transactions');
            console.error('Error loading transactions:', error);
        } finally {
            this.showLoading(false);
        }
    }

    renderTransactions(transactions) {
        const tableBody = document.getElementById('transactionsTable');
        const emptyState = document.getElementById('emptyState');

        if (!transactions.length) {
            tableBody.innerHTML = '';
            emptyState.classList.remove('d-none');
            return;
        }

        emptyState.classList.add('d-none');
        tableBody.innerHTML = transactions.map(transaction => `
            <tr>
                <td>${this.formatDate(transaction.date)}</td>
                <td><small>${transaction.reference}</small></td>
                <td class="${this.getTypeClass(transaction.type)}">
                    <i class="${this.getTypeIcon(transaction.type)}"></i>
                    ${this.capitalizeFirst(transaction.type)}
                </td>
                <td>${transaction.description}</td>
                <td class="${transaction.amount >= 0 ? 'text-success' : 'text-danger'}">
                    ${transaction.amount >= 0 ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}
                </td>
                <td>
                    <span class="badge bg-${this.getStatusClass(transaction.status)}">
                        ${this.capitalizeFirst(transaction.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-transaction" 
                            data-transaction-id="${transaction.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        this.updatePagination(transactions.length);
    }

    updateSummary(transactions) {
        const summary = transactions.reduce((acc, transaction) => {
            acc.total++;
            if (transaction.amount > 0) {
                acc.deposits += transaction.amount;
            } else {
                acc.withdrawals += Math.abs(transaction.amount);
            }
            return acc;
        }, { total: 0, deposits: 0, withdrawals: 0 });

        document.getElementById('totalTransactions').textContent = summary.total;
        document.getElementById('totalDeposits').textContent = `$${summary.deposits.toFixed(2)}`;
        document.getElementById('totalWithdrawals').textContent = `$${summary.withdrawals.toFixed(2)}`;
        document.getElementById('netBalance').textContent = 
            `$${(summary.deposits - summary.withdrawals).toFixed(2)}`;
    }

    initializeEventListeners() {
        // Filter form submission
        document.getElementById('filterForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.filters = {
                type: document.getElementById('filterType').value,
                status: document.getElementById('filterStatus').value,
                search: document.getElementById('filterSearch').value,
                dateRange: this.filters.dateRange,
                startDate: this.filters.startDate,
                endDate: this.filters.endDate
            };
            this.currentPage = 1;
            this.loadTransactions();
        });

        // View transaction details
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-transaction')) {
                const transactionId = e.target.closest('.view-transaction').dataset.transactionId;
                this.showTransactionDetails(transactionId);
            }
        });

        // Date range selection
        document.querySelectorAll('[data-range]').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleDateRangeSelection(e.target.dataset.range);
            });
        });

        // Custom date range
        document.getElementById('applyCustomDate').addEventListener('click', () => {
            this.handleCustomDateRange();
        });

        // Refresh button
        document.getElementById('refreshTransactions').addEventListener('click', () => {
            this.loadTransactions();
        });

        // Export button
        document.getElementById('exportTransactions').addEventListener('click', () => {
            this.exportTransactions();
        });

        // Sign out button
        document.getElementById('signOutButton').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSignOut();
        });
    }

    async showTransactionDetails(transactionId) {
        try {
            this.showLoading(true);
            // Simulated API call - replace with actual API endpoint
            const transaction = {
                id: transactionId,
                date: '2024-01-20 14:30:45',
                reference: 'DEP20240120ABC123',
                type: 'deposit',
                amount: 500.00,
                status: 'completed',
                fee: 0.00,
                description: 'Initial deposit'
            };

            document.getElementById('detailTransactionId').textContent = transaction.id;
            document.getElementById('detailReferenceCode').textContent = transaction.reference;
            document.getElementById('detailType').textContent = this.capitalizeFirst(transaction.type);
            document.getElementById('detailAmount').textContent = `$${Math.abs(transaction.amount).toFixed(2)}`;
            document.getElementById('detailDateTime').textContent = this.formatDate(transaction.date);
            document.getElementById('detailStatus').innerHTML = `
                <span class="badge bg-${this.getStatusClass(transaction.status)}">
                    ${this.capitalizeFirst(transaction.status)}
                </span>
            `;
            document.getElementById('detailFee').textContent = `$${transaction.fee.toFixed(2)}`;
            document.getElementById('detailDescription').textContent = transaction.description;

            const modal = new bootstrap.Modal(document.getElementById('transactionDetailsModal'));
            modal.show();
        } catch (error) {
            this.showToast('error', 'Failed to load transaction details');
        } finally {
            this.showLoading(false);
        }
    }

    handleDateRangeSelection(range) {
        this.filters.dateRange = range;
        if (range === 'custom') {
            const modal = new bootstrap.Modal(document.getElementById('customDateModal'));
            modal.show();
        } else {
            document.getElementById('dateRangeDropdown').textContent = 
                this.capitalizeFirst(range === 'all' ? 'All Time' : range);
            this.loadTransactions();
        }
    }

    handleCustomDateRange() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
            this.showToast('error', 'Please select both start and end dates');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            this.showToast('error', 'Start date cannot be after end date');
            return;
        }

        this.filters.startDate = startDate;
        this.filters.endDate = endDate;
        document.getElementById('dateRangeDropdown').textContent = 
            `${startDate} - ${endDate}`;

        const modal = bootstrap.Modal.getInstance(document.getElementById('customDateModal'));
        modal.hide();

        this.loadTransactions();
    }

    async exportTransactions() {
        try {
            this.showLoading(true);
            // Implement export logic here
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            this.showToast('success', 'Transactions exported successfully');
        } catch (error) {
            this.showToast('error', 'Failed to export transactions');
        } finally {
            this.showLoading(false);
        }
    }

    handleSignOut() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = './login.html';
    }

    // Utility functions
    showLoading(show) {
        // Implement loading indicator
    }

    showToast(type, message) {
        const toast = document.getElementById('toast');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');

        toastTitle.textContent = type === 'success' ? 'Success' : 'Error';
        toastTitle.className = `me-auto text-${type === 'success' ? 'success' : 'danger'}`;
        toastMessage.textContent = message;

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleString();
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    getTypeClass(type) {
        const classes = {
            deposit: 'text-success',
            withdrawal: 'text-danger',
            transfer: 'text-primary',
            payment: 'text-warning'
        };
        return classes[type] || 'text-secondary';
    }

    getTypeIcon(type) {
        const icons = {
            deposit: 'bi bi-plus-circle',
            withdrawal: 'bi bi-dash-circle',
            transfer: 'bi bi-arrow-left-right',
            payment: 'bi bi-credit-card'
        };
        return icons[type] || 'bi bi-question-circle';
    }

    getStatusClass(status) {
        const classes = {
            completed: 'success',
            pending: 'warning',
            failed: 'danger',
            cancelled: 'secondary'
        };
        return classes[status] || 'secondary';
    }

    updatePagination(total) {
        const totalPages = Math.ceil(total / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        let html = '';

        if (totalPages > 1) {
            html += `
                <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${this.currentPage - 1}">Previous</a>
                </li>
            `;

            for (let i = 1; i <= totalPages; i++) {
                html += `
                    <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            }

            html += `
                <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${this.currentPage + 1}">Next</a>
                </li>
            `;
        }

        pagination.innerHTML = html;
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    const transactionManager = new TransactionManager();
});
// Add these methods to your TransactionManager class

class TransactionManager {
    // ... (previous code remains the same)

    // Transaction Data Management Methods
    async loadTransactionData() {
        try {
            const response = await fetch('/api/transactions/summary', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to load transaction data');

            const data = await response.json();
            this.updateDashboardStats(data);
            return data;
        } catch (error) {
            this.showToast('error', 'Failed to load transaction data');
            console.error('Error:', error);
        }
    }

    updateDashboardStats(data) {
        // Update summary cards
        document.getElementById('totalTransactions').textContent = data.totalCount;
        document.getElementById('totalDeposits').textContent = 
            this.formatCurrency(data.totalDeposits);
        document.getElementById('totalWithdrawals').textContent = 
            this.formatCurrency(data.totalWithdrawals);
        document.getElementById('netBalance').textContent = 
            this.formatCurrency(data.totalDeposits - data.totalWithdrawals);
    }

    async getTransactionDetails(transactionId) {
        try {
            const response = await fetch(`/api/transactions/${transactionId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to load transaction details');

            const transaction = await response.json();
            return transaction;
        } catch (error) {
            this.showToast('error', 'Failed to load transaction details');
            console.error('Error:', error);
            return null;
        }
    }

    async createTransaction(transactionData) {
        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transactionData)
            });

            if (!response.ok) throw new Error('Failed to create transaction');

            const result = await response.json();
            this.showToast('success', 'Transaction created successfully');
            await this.loadTransactions(); // Refresh the transaction list
            return result;
        } catch (error) {
            this.showToast('error', 'Failed to create transaction');
            console.error('Error:', error);
            return null;
        }
    }

    async updateTransactionStatus(transactionId, newStatus) {
        try {
            const response = await fetch(`/api/transactions/${transactionId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Failed to update transaction status');

            const result = await response.json();
            this.showToast('success', 'Transaction status updated successfully');
            await this.loadTransactions(); // Refresh the transaction list
            return result;
        } catch (error) {
            this.showToast('error', 'Failed to update transaction status');
            console.error('Error:', error);
            return null;
        }
    }

    async generateTransactionReport(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`/api/transactions/report?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to generate report');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transaction-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showToast('success', 'Report generated successfully');
        } catch (error) {
            this.showToast('error', 'Failed to generate report');
            console.error('Error:', error);
        }
    }

    // Transaction Data Formatting Methods
    formatTransactionData(transaction) {
        return {
            ...transaction,
            formattedAmount: this.formatCurrency(transaction.amount),
            formattedDate: this.formatDate(transaction.date),
            statusBadge: this.getStatusBadge(transaction.status),
            typeBadge: this.getTypeBadge(transaction.type)
        };
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    getStatusBadge(status) {
        const statusClasses = {
            completed: 'success',
            pending: 'warning',
            failed: 'danger',
            cancelled: 'secondary'
        };

        return `<span class="badge bg-${statusClasses[status] || 'secondary'}">
            ${this.capitalizeFirst(status)}
        </span>`;
    }

    getTypeBadge(type) {
        const typeClasses = {
            deposit: 'success',
            withdrawal: 'danger',
            transfer: 'primary',
            payment: 'warning'
        };

        const typeIcons = {
            deposit: 'plus-circle',
            withdrawal: 'dash-circle',
            transfer: 'arrow-left-right',
            payment: 'credit-card'
        };

        return `<span class="badge bg-${typeClasses[type] || 'secondary'}">
            <i class="bi bi-${typeIcons[type] || 'question-circle'}"></i> 
            ${this.capitalizeFirst(type)}
        </span>`;
    }

    // Transaction Search and Filter Methods
    filterTransactions(transactions, filters) {
        return transactions.filter(transaction => {
            // Type filter
            if (filters.type && transaction.type !== filters.type) return false;

            // Status filter
            if (filters.status && transaction.status !== filters.status) return false;

            // Date range filter
            if (filters.startDate && filters.endDate) {
                const transactionDate = new Date(transaction.date);
                const startDate = new Date(filters.startDate);
                const endDate = new Date(filters.endDate);
                if (transactionDate < startDate || transactionDate > endDate) return false;
            }

            // Search text
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                return (
                    transaction.reference.toLowerCase().includes(searchLower) ||
                    transaction.description.toLowerCase().includes(searchLower)
                );
            }

            return true;
        });
    }

    // Transaction Export Methods
    async exportTransactionsCsv(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`/api/transactions/export/csv?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to export transactions');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showToast('success', 'Transactions exported successfully');
        } catch (error) {
            this.showToast('error', 'Failed to export transactions');
            console.error('Error:', error);
        }
    }

    // Transaction Validation Methods
    validateTransaction(transactionData) {
        const errors = [];

        if (!transactionData.type) {
            errors.push('Transaction type is required');
        }

        if (!transactionData.amount || isNaN(transactionData.amount)) {
            errors.push('Valid amount is required');
        }

        if (transactionData.amount <= 0) {
            errors.push('Amount must be greater than 0');
        }

        if (transactionData.type === 'transfer' && !transactionData.receiverId) {
            errors.push('Receiver is required for transfers');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Initialize Transaction Event Listeners
    initializeTransactionListeners() {
        // Export button click handler
        document.getElementById('exportTransactions').addEventListener('click', () => {
            this.exportTransactionsCsv(this.filters);
        });

        // Transaction filters form submit
        document.getElementById('filterForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.filters = {
                type: document.getElementById('filterType').value,
                status: document.getElementById('filterStatus').value,
                search: document.getElementById('filterSearch').value,
                startDate: document.getElementById('startDate').value,
                endDate: document.getElementById('endDate').value
            };
            this.currentPage = 1;
            this.loadTransactions();
        });

        // Transaction details view
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-transaction')) {
                const transactionId = e.target.closest('.view-transaction')
                    .dataset.transactionId;
                this.showTransactionDetails(transactionId);
            }
        });
    }
}


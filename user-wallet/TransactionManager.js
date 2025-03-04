class TransactionManager {
    constructor() {
        this.init();
        this.initializeEventListeners();
    }

    createTransactionRow(transaction) {
        return `
            <tr class="transaction-row" data-transaction-id="${transaction.id}">
                <td>
                    <div class="d-flex align-items-center">
                        <div class="transaction-date">
                            <div class="fw-bold">${transaction.date.split(',')[0]}</div>
                            <small class="text-muted">${transaction.date.split(',')[1]}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <small class="text-muted">${transaction.reference}</small>
                </td>
                <td>
                    <span class="transaction-type ${transaction.type.class}">
                        <i class="bi ${transaction.type.icon}"></i>
                        ${transaction.type.text}
                    </span>
                </td>
                <td>
                    <div class="transaction-description">
                        <div>${transaction.description}</div>
                        ${this.createTransferDetails(transaction)}
                    </div>
                </td>
                <td class="${transaction.amount.isPositive ? 'text-success' : 'text-danger'}">
                    ${transaction.amount.isPositive ? '+' : '-'}${transaction.amount.formatted}
                </td>
                <td>
                    <span class="badge ${transaction.status.class}">
                        ${transaction.status.text}
                    </span>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary view-transaction" 
                                data-bs-toggle="tooltip" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${this.getActionButtons(transaction)}
                    </div>
                </td>
            </tr>
        `;
    }

    createTransferDetails(transaction) {
        if (transaction.type.text === 'Transfer') {
            return `
                <small class="text-muted">
                    ${transaction.sender} → ${transaction.receiver}
                </small>
            `;
        }
        return '';
    }

    getActionButtons(transaction) {
        let buttons = '';
        
        if (transaction.status.text === 'Pending') {
            buttons += `
                <button class="btn btn-sm btn-outline-success approve-transaction" 
                        data-bs-toggle="tooltip" title="Approve">
                    <i class="bi bi-check-lg"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger cancel-transaction" 
                        data-bs-toggle="tooltip" title="Cancel">
                    <i class="bi bi-x-lg"></i>
                </button>
            `;
        }

        if (['Completed', 'Failed'].includes(transaction.status.text)) {
            buttons += `
                <button class="btn btn-sm btn-outline-secondary download-receipt" 
                        data-bs-toggle="tooltip" title="Download Receipt">
                    <i class="bi bi-download"></i>
                </button>
            `;
        }

        return buttons;
    }

    showTransactionDetails(transaction) {
        const modal = new bootstrap.Modal(document.getElementById('transactionDetailsModal'));
        
        document.getElementById('detailDate').textContent = transaction.date;
        document.getElementById('detailReference').textContent = transaction.reference;
        document.getElementById('detailType').innerHTML = `
            <i class="bi ${transaction.type.icon}"></i> ${transaction.type.text}
        `;
        document.getElementById('detailDescription').textContent = transaction.description;
        document.getElementById('detailAmount').textContent = transaction.amount.formatted;
        document.getElementById('detailStatus').innerHTML = `
            <span class="badge ${transaction.status.class}">${transaction.status.text}</span>
        `;
        document.getElementById('detailFee').textContent = transaction.fee;

        if (transaction.type.text === 'Transfer') {
            document.getElementById('transferDetails').style.display = 'block';
            document.getElementById('detailSender').textContent = transaction.sender;
            document.getElementById('detailReceiver').textContent = transaction.receiver;
        } else {
            document.getElementById('transferDetails').style.display = 'none';
        }

        modal.show();
    }

    initializeEventListeners() {
        // View transaction details
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-transaction')) {
                const row = e.target.closest('.transaction-row');
                const transactionId = row.dataset.transactionId;
                this.loadTransactionDetails(transactionId);
            }
        });

        // Approve transaction
        document.addEventListener('click', (e) => {
            if (e.target.closest('.approve-transaction')) {
                const row = e.target.closest('.transaction-row');
                const transactionId = row.dataset.transactionId;
                this.approveTransaction(transactionId);
            }
        });

        // Cancel transaction
        document.addEventListener('click', (e) => {
            if (e.target.closest('.cancel-transaction')) {
                const row = e.target.closest('.transaction-row');
                const transactionId = row.dataset.transactionId;
                this.cancelTransaction(transactionId);
            }
        });

        // Download receipt
        document.addEventListener('click', (e) => {
            if (e.target.closest('.download-receipt')) {
                const row = e.target.closest('.transaction-row');
                const transactionId = row.dataset.transactionId;
                this.downloadReceipt(transactionId);
            }
        });
    }
}

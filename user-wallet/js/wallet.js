class WalletManager {
    constructor() {
        this.baseApiUrl = '../api/transaction';
        this.token = this.getToken();
        this.user = this.getUser();
        
        // Initialize event listeners
        this.initEventListeners();
    }
    
    // Get JWT token from local storage
    getToken() {
        const userData = localStorage.getItem('walletUser');
        if (userData) {
            const user = JSON.parse(userData);
            return user.token;
        }
        return null;
    }
    
    // Get user data from local storage
    getUser() {
        const userData = localStorage.getItem('walletUser');
        if (userData) {
            return JSON.parse(userData);
        }
        return null;
    }
    
    // Initialize event listeners
    initEventListeners() {
        // Deposit form submission
        $('#depositForm').on('submit', (e) => {
            e.preventDefault();
            this.processDeposit();
        });
        
        // Withdraw form submission
        $('#withdrawForm').on('submit', (e) => {
            e.preventDefault();
            this.processWithdrawal();
        });
        
        // Transfer form submission
        $('#transferForm').on('submit', (e) => {
            e.preventDefault();
            this.processTransfer();
        });
        
        // Refresh balance button
        $('#refreshBalance').on('click', () => {
            this.refreshBalance();
        });
    }
    
    // Process deposit
    processDeposit() {
        const amount = parseFloat($('#depositAmount').val());
        const method = $('#depositMethod').val();
        
        if (isNaN(amount) || amount <= 0) {
            this.showAlert('danger', 'Please enter a valid amount.');
            return;
        }
        
        if (!method) {
            this.showAlert('danger', 'Please select a payment method.');
            return;
        }
        
        // Show loading state
        $('#confirmDeposit').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...').prop('disabled', true);
        
        // Prepare transaction data
        const data = {
            transaction_type: 'deposit',
            receiver_wallet_id: this.user.wallet_id,
            amount: amount,
            fee: 0,
            description: `Deposit via ${method}`
        };
        
        // Make API request
        this.makeApiRequest('create.php', 'POST', data)
            .then(response => {
                if (response.success) {
                    // Update the wallet balance
                    this.updateWalletBalance(response.wallet.updated_balance);
                    
                    // Hide deposit modal
                    $('#depositModal').modal('hide');
                    
                    // Reset form
                    $('#depositForm')[0].reset();
                    
                    // Show success message
                    this.showSuccessModal('Deposit Successful', `$${amount.toFixed(2)} has been added to your wallet.`);
                } else {
                    this.showAlert('danger', response.message || 'An error occurred while processing your deposit.');
                }
                
                // Reset button state
                $('#confirmDeposit').html('Confirm Deposit').prop('disabled', false);
            })
            .catch(error => {
                console.error('Error:', error);
                this.showAlert('danger', 'An error occurred while processing your deposit.');
                $('#confirmDeposit').html('Confirm Deposit').prop('disabled', false);
            });
    }
    
    // Process withdrawal
    processWithdrawal() {
        const amount = parseFloat($('#withdrawAmount').val());
        const method = $('#withdrawMethod').val();
        const description = $('#withdrawDescription').val();
        
        if (isNaN(amount) || amount <= 0) {
            this.showAlert('danger', 'Please enter a valid amount.');
            return;
        }
        
        if (!method) {
            this.showAlert('danger', 'Please select a withdrawal method.');
            return;
        }
        
        // Calculate fee (for demo purposes)
        const fee = amount * 0.015; // 1.5% fee
        
        // Check if user has sufficient balance
        if (amount + fee > this.user.balance) {
            this.showAlert('danger', 'Insufficient balance for this withdrawal.');
            return;
        }
        
        // Show loading state
        $('#confirmWithdraw').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...').prop('disabled', true);
        
        // Prepare transaction data
        const data = {
            transaction_type: 'withdrawal',
            sender_wallet_id: this.user.wallet_id,
            amount: amount,
            fee: fee,
            description: description || `Withdrawal via ${method}`
        };
        
        // Make API request
        this.makeApiRequest('create.php', 'POST', data)
            .then(response => {
                if (response.success) {
                    // Update the wallet balance
                    this.updateWalletBalance(response.wallet.updated_balance);
                    
                    // Hide withdrawal modal
                    $('#withdrawModal').modal('hide');
                    
                    // Reset form
                    $('#withdrawForm')[0].reset();
                    
                    // Show success message
                    this.showSuccessModal('Withdrawal Successful', `$${amount.toFixed(2)} has been withdrawn from your wallet.`);
                } else {
                    this.showAlert('danger', response.message || 'An error occurred while processing your withdrawal.');
                }
                
                // Reset button state
                $('#confirmWithdraw').html('Confirm Withdrawal').prop('disabled', false);
            })
            .catch(error => {
                console.error('Error:', error);
                this.showAlert('danger', 'An error occurred while processing your withdrawal.');
                $('#confirmWithdraw').html('Confirm Withdrawal').prop('disabled', false);
            });
    }
    
    // Process transfer
    processTransfer() {
        const receiverEmail = $('#receiverEmail').val();
        const amount = parseFloat($('#transferAmount').val());
        const description = $('#transferDescription').val();
        
        if (!receiverEmail) {
            this.showAlert('danger', 'Please enter the recipient\'s email.');
            return;
        }
        
        if (isNaN(amount) || amount <= 0) {
            this.showAlert('danger', 'Please enter a valid amount.');
            return;
        }
        
        // Check if user has sufficient balance
        if (amount > this.user.balance) {
            this.showAlert('danger', 'Insufficient balance for this transfer.');
            return;
        }
        
        // Show loading state
        $('#confirmTransfer').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...').prop('disabled', true);
        
        // First, we need to get the receiver's wallet ID by email
        this.makeApiRequest('get_wallet_by_email.php', 'POST', { email: receiverEmail })
            .then(response => {
                if (response.success) {
                    // Prepare transaction data
                    const data = {
                        transaction_type: 'transfer',
                        sender_wallet_id: this.user.wallet_id,
                        receiver_wallet_id: response.wallet_id,
                        amount: amount,
                        fee: 0,
                        description: description || `Transfer to ${receiverEmail}`
                    };
                    
                    // Make API request for the transfer
                    return this.makeApiRequest('create.php', 'POST', data);
                } else {
                    throw new Error(response.message || 'Recipient not found.');
                }
            })
            .then(response => {
                if (response.success) {
                    // Update the wallet balance
                    this.updateWalletBalance(response.wallet.updated_balance);
                    
                    // Hide transfer modal
                    $('#transferModal').modal('hide');
                    
                    // Reset form
                    $('#transferForm')[0].reset();
                    
                    // Show success message
                    this.showSuccessModal('Transfer Successful', `$${amount.toFixed(2)} has been sent to ${receiverEmail}.`);
                } else {
                    this.showAlert('danger', response.message || 'An error occurred while processing your transfer.');
                }
                
                // Reset button state
                $('#confirmTransfer').html('Confirm Transfer').prop('disabled', false);
            })
            .catch(error => {
                console.error('Error:', error);
                this.showAlert('danger', error.message || 'An error occurred while processing your transfer.');
                $('#confirmTransfer').html('Confirm Transfer').prop('disabled', false);
            });
    }
    
    // Refresh wallet balance
    refreshBalance() {
        // Show loading state
        $('#refreshBalance').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>').prop('disabled', true);
        
        // Make API request
        this.makeApiRequest('get_balance.php', 'POST', { wallet_id: this.user.wallet_id })
            .then(response => {
                if (response.success) {
                    // Update the wallet balance
                    this.updateWalletBalance(response.balance);
                    
                    // Show success message in a toast
                    this.showToast('Balance updated successfully.');
                } else {
                    this.showAlert('danger', response.message || 'An error occurred while refreshing your balance.');
                }
                
                // Reset button state
                $('#refreshBalance').html('<i class="bi bi-arrow-repeat"></i> Refresh').prop('disabled', false);
            })
            .catch(error => {
                console.error('Error:', error);
                this.showAlert('danger', 'An error occurred while refreshing your balance.');
                $('#refreshBalance').html('<i class="bi bi-arrow-repeat"></i> Refresh').prop('disabled', false);
            });
    }
    
    // Update wallet balance in the UI
    updateWalletBalance(balance) {
        // Update user data in local storage
        this.user.balance = balance;
        localStorage.setItem('walletUser', JSON.stringify(this.user));
        
        // Update balance display
        $('#balanceAmount').text(parseFloat(balance).toFixed(2));
        $('#lastUpdated').text(new Date().toLocaleTimeString());
        
        // Add animation effect to balance display
        $('#balanceDisplay').addClass('balance-updated');
        setTimeout(() => {
            $('#balanceDisplay').removeClass('balance-updated');
        }, 1500);
    }
    
    // Make API request
    makeApiRequest(endpoint, method, data) {
        const url = `${this.baseApiUrl}/${endpoint}`;
        
        return fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
    }
    
    // Show alert
    showAlert(type, message) {
        const alertElement = $('#transactionAlert');
        if (alertElement.length === 0) {
            // Create alert element if it doesn't exist
            $('<div id="transactionAlert" class="alert mt-3" role="alert"></div>').insertBefore('#depositForm, #withdrawForm, #transferForm');
        }
        
        // Set alert content
        $('#transactionAlert')
            .removeClass('alert-success alert-danger alert-warning alert-info')
            .addClass(`alert-${type}`)
            .html(message)
            .show();
        
        // Hide alert after 5 seconds
        setTimeout(() => {
            $('#transactionAlert').fadeOut();
        }, 5000);
    }
    
    // Show success modal
    showSuccessModal(title, message) {
        $('#successModalLabel').text(title);
        $('#successMessage').text(title);
        $('#successDetails').text(message);
        $('#successModal').modal('show');
    }
    
    // Show toast notification
    showToast(message) {
        // Check if toast container exists
        if ($('#toastContainer').length === 0) {
            $('body').append(`
                <div id="toastContainer" class="toast-container position-fixed bottom-0 end-0 p-3">
                    <div id="walletToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                        <div class="toast-header">
                            <strong class="me-auto">Wallet Notification</strong>
                            <small>Just now</small>
                            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                        </div>
                        <div class="toast-body"></div>
                    </div>
                </div>
            `);
        }
        
        // Set toast content
        $('#walletToast .toast-body').text(message);
        
        // Create and show toast
        const toast = new bootstrap.Toast($('#walletToast'));
        toast.show();
    }
}

// Initialize the wallet manager when document is ready
$(document).ready(function() {
    const walletManager = new WalletManager();
    
    // Check if user is logged in
    if (!walletManager.token || !walletManager.user) {
        // Redirect to login page if not logged in
        window.location.href = 'login.html';
        return;
    }
    
    // Set user name in the header
    $('#userFullName').text(`${walletManager.user.first_name} ${walletManager.user.last_name}`);
    
    // Set initial balance
    $('#balanceAmount').text(parseFloat(walletManager.user.balance).toFixed(2));
    
    // Update last updated time
    $('#lastUpdated').text(new Date().toLocaleTimeString());
    
    // Add CSS for balance update animation
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .balance-updated {
            animation: balance-pulse 1.5s ease;
        }
        
        @keyframes balance-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); color: #28a745; }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(styleElement);
    
    // Load recent transactions
    loadRecentTransactions();
    
    // Load unread notifications count
    loadNotificationsCount();
});

// Load recent transactions
function loadRecentTransactions() {
    const walletManager = new WalletManager();
    
    // Make API request
    walletManager.makeApiRequest('get_transactions.php', 'POST', { limit: 5, offset: 0 })
        .then(response => {
            if (response.success) {
                // Clear existing transactions
                $('#recentTransactions').empty();
                
                // Add transactions to the table
                response.transactions.forEach(transaction => {
                    let typeIcon, typeClass, amountClass, amountPrefix;
                    
                    if (transaction.transaction_type === 'deposit') {
                        typeIcon = '<i class="bi bi-plus-circle"></i>';
                        typeClass = 'text-success';
                        amountClass = 'text-success';
                        amountPrefix = '+';
                    } else if (transaction.transaction_type === 'withdrawal') {
                        typeIcon = '<i class="bi bi-dash-circle"></i>';
                        typeClass = 'text-danger';
                        amountClass = 'text-danger';
                        amountPrefix = '-';
                    } else { // transfer
                        typeIcon = '<i class="bi bi-arrow-left-right"></i>';
                        typeClass = 'text-primary';
                        
                        // Check if user is sender or receiver
                        if (transaction.sender_wallet_id === walletManager.user.wallet_id) {
                            amountClass = 'text-danger';
                            amountPrefix = '-';
                        } else {
                            amountClass = 'text-success';
                            amountPrefix = '+';
                        }
                    }
                    
                    // Format date
                    const date = new Date(transaction.created_at).toLocaleString();
                    
                    // Capitalize transaction type
                    const type = transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1);
                    
                    // Create table row
                    const row = `
                        <tr>
                            <td>${date}</td>
                            <td class="${typeClass}">${typeIcon} ${type}</td>
                            <td class="${amountClass}">${amountPrefix}${parseFloat(transaction.amount).toFixed(2)}</td>
                            <td>${transaction.description || '-'}</td>
                            <td><span class="badge bg-${transaction.status === 'completed' ? 'success' : (transaction.status === 'pending' ? 'warning' : 'danger')}">${transaction.status}</span></td>
                            <td><small>${transaction.reference_code}</small></td>
                        </tr>
                    `;
                    
                    // Add row to table
                    $('#recentTransactions').append(row);
                });
                
                // If no transactions, show message
                if (response.transactions.length === 0) {
                    $('#recentTransactions').append('<tr><td colspan="6" class="text-center">No recent transactions</td></tr>');
                }
            } else {
                // Show error message
                $('#recentTransactions').html('<tr><td colspan="6" class="text-center text-danger">Failed to load transactions</td></tr>');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            $('#recentTransactions').html('<tr><td colspan="6" class="text-center text-danger">Failed to load transactions</td></tr>');
        });
}

// Load unread notifications count
function loadNotificationsCount() {
    const walletManager = new WalletManager();
    
    // Make API request
    walletManager.makeApiRequest('get_notifications_count.php', 'POST', {})
        .then(response => {
            if (response.success) {
                // Update notification badge
                const count = parseInt(response.count);
                $('#notificationCount').text(count);
                
                // Show/hide badge based on count
                if (count > 0) {
                    $('#notificationCount').removeClass('d-none');
                } else {
                    $('#notificationCount').addClass('d-none');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

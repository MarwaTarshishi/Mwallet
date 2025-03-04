.card-body {
    transition: all 0.3s ease;

.card-body {
    transition: all 0.3s ease;
}
@keyframes balance-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); color: #28a745; }
    100% { transform: scale(1); }
}

.balance-updated {
    animation: balance-pulse 1.5s ease;
}
.transaction-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
}

.transaction-deposit {
    background-color: rgba(40, 167, 69, 0.1);
    color: #28a745;
    border: 1px solid rgba(40, 167, 69, 0.2);
}

.transaction-withdrawal {
    background-color: rgba(220, 53, 69, 0.1);
    color: #dc3545;
    border: 1px solid rgba(220, 53, 69, 0.2);
}

.transaction-transfer {
    background-color: rgba(0, 123, 255, 0.1);
    color: #007bff;
    border: 1px solid rgba(0, 123, 255, 0.2);
}

/* Transaction modals */
.modal-title-icon {
    margin-right: 0.5rem;
    vertical-align: middle;
}
.transaction-form .form-control {
    border-radius: 0.25rem;
    border: 1px solid #ced4da;
    padding: 0.5rem 0.75rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.transaction-form .form-control:focus {
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}


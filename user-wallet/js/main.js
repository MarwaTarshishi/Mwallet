const API_BASE_URL = '../server-wallet/api';

// Toast notifications
function showToast(message, type = 'success') {
    // Create toast container if it doesn't exist
    if (!document.querySelector('.toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <span class="rounded me-2 ${type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-primary'}" style="width: 20px; height: 20px;"></span>
                <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <small>Just now</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

    // Add toast to container
    document.querySelector('.toast-container').insertAdjacentHTML('beforeend', toastHtml);

    // Initialize and show the toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
    toast.show();

    // Remove toast from DOM after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Format currency with proper symbol
function formatCurrency(amount, currency = 'USD') {
    const currencySymbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CNY': '¥',
        'INR': '₹'
    };

    const symbol = currencySymbols[currency] || currency;
    return symbol + parseFloat(amount).toFixed(2);
}

// Format date from ISO string to readable format
function formatDate(dateString, includeTime = true) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    return date.toLocaleDateString('en-US', options);
}

// Copy text to clipboard
function copyToClipboard(text) {
    const temp = document.createElement('input');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    showToast('Copied to clipboard!', 'success');
}

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Validate password strength
function validatePassword(password) {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(password);
}

// Password strength checker
function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
}

// Update password strength meter
function updatePasswordStrength(password, elementId) {
    const strengthElement = document.getElementById(elementId);
    if (!strengthElement) return;
    const strength = checkPasswordStrength(password);
    const strengthClasses = ['bg-danger', 'bg-warning', 'bg-info', 'bg-primary', 'bg-success'];
    const strengthLabels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
    strengthElement.className = 'progress-bar ' + strengthClasses[strength];
    strengthElement.style.width = ((strength + 1) * 20) + '%';
    strengthElement.textContent = strengthLabels[strength];
    strengthElement.setAttribute('aria-valuenow', (strength + 1) * 20);
}

// Format card number with spaces
function formatCardNumber(value) {
    return value.replace(/\s+/g, '').replace(/[^0-9]/g, '').match(/.{1,4}/g)?.join(' ') || value;
}

// Format expiry date (MM/YY)
function formatExpiryDate(value) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    return v.length >= 2 ? v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '') : v;
}

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));

    // Format card number input
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            e.target.value = formatCardNumber(e.target.value);
        });
    }

    // Format expiry date input
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            e.target.value = formatExpiryDate(e.target.value);
        });
    }

    // Password strength meter
    const passwordInput = document.getElementById('password');
    const strengthMeter = document.getElementById('passwordStrength');
    if (passwordInput && strengthMeter) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value, 'passwordStrength');
        });
    }
});

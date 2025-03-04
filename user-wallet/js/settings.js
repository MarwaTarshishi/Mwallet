class SettingsManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadUserSettings();
        this.initializeEventListeners();
        this.initializeValidation();
    }

    async loadUserSettings() {
        try {
            const response = await fetch('/api/settings', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load settings');
            
            const settings = await response.json();
            this.populateSettings(settings);
        } catch (error) {
            this.showError('Failed to load settings');
        }
    }

    populateSettings(settings) {
        // Personal Info
        document.getElementById('firstName').value = settings.firstName;
        document.getElementById('lastName').value = settings.lastName;
        document.getElementById('email').value = settings.email;
        document.getElementById('phone').value = settings.phone;

        // Preferences
        document.getElementById('language').value = settings.language;
        document.getElementById('timezone').value = settings.timezone;
        document.getElementById('currency').value = settings.currency;

        // Notifications
        document.getElementById('emailTransactions').checked = settings.notifications.email.transactions;
        document.getElementById('emailSecurity').checked = settings.notifications.email.security;
        document.getElementById('pushTransactions').checked = settings.notifications.push.transactions;
        document.getElementById('pushSecurity').checked = settings.notifications.push.security;

        // Privacy
        document.getElementById('profileVisible').checked = settings.privacy.profileVisible;
        document.getElementById('activityVisible').checked = settings.privacy.activityVisible;

        // Load payment methods
        this.loadPaymentMethods(settings.paymentMethods);
    }

    initializeEventListeners() {
        // Form submissions
        document.getElementById('personalInfoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updatePersonalInfo();
        });

        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updatePassword();
        });

        // 2FA toggle
        document.getElementById('enable2FA').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.setup2FA();
            } else {
                this.disable2FA();
            }
        });

        // Payment method events
        document.getElementById('savePaymentMethod').addEventListener('click', () => {
            this.addPaymentMethod();
        });

        // Delete account
        document.getElementById('confirmDeleteAccount').addEventListener('click', () => {
            this.deleteAccount();
        });
    }

    async updatePersonalInfo() {
        try {
            const data = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                phone: document.getElementById('phone').value
            };

            const response = await fetch('/api/settings/personal', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Failed to update personal info');
            
            this.showSuccess('Personal information updated successfully');
        } catch (error) {
            this.showError('Failed to update personal information');
        }
    }

    async updatePassword() {
        try {
            const data = {
                currentPassword: document.getElementById('currentPassword').value,
                newPassword: document.getElementById('newPassword').value,
                confirmPassword: document.getElementById('confirmPassword').value
            };

            if (data.newPassword !== data.confirmPassword) {
                this.showError('Passwords do not match');
                return;
            }

            const response = await fetch('/api/settings/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Failed to update password');
            
            this.showSuccess('Password updated successfully');
            document.getElementById('passwordForm').reset();
        } catch (error) {
            this.showError('Failed to update password');
        }
    }

    async setup2FA() {
        try {
            const response = await fetch('/api/settings/2fa/setup', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to setup 2FA');
            
            const data = await response.json();
            document.getElementById('qrCode').src = data.qrCode;
            
            const modal = new bootstrap.Modal(document.getElementById('setup2FAModal'));
            modal.show();
        } catch (error) {
            this.showError('Failed to setup two-factor authentication');
        }
    }

    showSuccess(message) {
        const toast = new bootstrap.Toast(document.getElementById('successToast'));
        document.querySelector('#successToast .toast-body').textContent = message;
        toast.show();
    }

    showError(message) {
        const toast = new bootstrap.Toast(document.getElementById('errorToast'));
        document.querySelector('#errorToast .toast-body').textContent = message;
        toast.show();
    }
}

// Initialize settings manager when document is ready
document.addEventListener('DOMContentLoaded', () => {
    const settingsManager = new SettingsManager();
});
  

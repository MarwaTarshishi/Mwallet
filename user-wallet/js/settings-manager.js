class SettingsManager {
    constructor() {
        this.init();
    }

    async init() {
        this.initializeEventListeners();
        await this.loadUserSettings();
    }

    async loadUserSettings() {
        try {
            const settings = await SettingsService.getSettings();
            this.populateSettings(settings);
        } catch (error) {
            this.showError('Failed to load settings');
        }
    }

    populateSettings(settings) {
        // General Settings
        document.getElementById('language').value = settings.language;
        document.getElementById('currency').value = settings.currency;
        document.getElementById('timezone').value = settings.timezone;
        document.getElementById('darkMode').checked = settings.darkMode;

        // Notification Settings
        document.getElementById('emailTransactions').checked = settings.notifications.email.transactions;
        document.getElementById('emailSecurity').checked = settings.notifications.email.security;
        // ... populate other settings
    }

    initializeEventListeners() {
        // General Settings Form
        document.getElementById('generalSettingsForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleGeneralSettingsUpdate();
        });

        // Password Change
        document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handlePasswordChange();
        });

        // Two-Factor Toggle
        document.getElementById('enableTwoFactor').addEventListener('change', (e) => {
            this.handleTwoFactorToggle(e.target.checked);
        });

        // Payment Methods
        document.getElementById('savePaymentMethod').addEventListener('click', async () => {
            await this.handleAddPaymentMethod();
        });

        // Delete Account
        document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
            await this.handleAccountDeletion();
        });
    }

    async handleGeneralSettingsUpdate() {
        try {
            const settings = {
                language: document.getElementById('language').value,
                currency: document.getElementById('currency').value,
                timezone: document.getElementById('timezone').value,
                darkMode: document.getElementById('darkMode').checked
            };

            await SettingsService.updateGeneralSettings(settings);
            this.showSuccess('General settings updated successfully');
        } catch (error) {
            this.showError('Failed to update settings');
        }
    }

    async handlePasswordChange() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        try {
            await SettingsService.updatePassword({
                currentPassword,
                newPassword
            });
            this.showSuccess('Password updated successfully');
            document.getElementById('changePasswordForm').reset();
        } catch (error) {
            this.showError('Failed to update password');
        }
    }

    handleTwoFactorToggle(enabled) {
        const settingsDiv = document.getElementById('twoFactorSettings');
        settingsDiv.style.display = enabled ? 'block' : 'none';
    }

    async handleAddPaymentMethod() {
        const activeTab = document.querySelector('#paymentMethodTabs .nav-link.active');
        const isCard = activeTab.id === 'card-tab';

        try {
            const paymentData = isCard ? this.getCardData() : this.getBankData();
            await SettingsService.addPaymentMethod(paymentData);
            this.showSuccess('Payment method added successfully');
            $('#addPaymentMethodModal').modal('hide');
        } catch (error) {
            this.showError('Failed to add payment method');
        }
    }

    getCardData() {
        return {
            type: 'card',
            holderName: document.getElementById('cardholderName').value,
            number: document.getElementById('cardNumber').value,
            expiry: document.getElementById('expiryDate').value,
            cvv: document.getElementById('cvv').value,
            isDefault: document.getElementById('setAsDefaultCard').checked
        };
    }

    getBankData() {
        return {
            type: 'bank',
            holderName: document.getElementById('accountHolderName').value,
            bankName: document.getElementById('bankName').value,
            routingNumber: document.getElementById('routingNumber').value,
            accountNumber: document.getElementById('accountNumber').value,
            accountType: document.getElementById('accountType').value,
            isDefault: document.getElementById('setAsDefaultBank').checked
        };
    }

    async handleAccountDeletion() {
        const confirmed = await this.showConfirmDialog(
            'Are you sure you want to delete your account? This action cannot be undone.'
        );

        if (confirmed) {
            try {
                const reason = document.getElementById('deleteReason').value;
                const otherReason = document.getElementById('otherReason').value;
                
                await SettingsService.deleteAccount({
                    reason,
                    otherReason: reason === 'other' ? otherReason : ''
                });

                window.location.href = '/logout';
            } catch (error) {
                this.showError('Failed to delete account');
            }
        }
    }

    showSuccess(message) {
        // Implement toast notification
    }

    showError(message) {
        // Implement toast notification
    }

    showConfirmDialog(message) {
        return new Promise((resolve) => {
            if (confirm(message)) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }
}

// Initialize settings manager
document.addEventListener('DOMContentLoaded', () => {
    const settingsManager = new SettingsManager();
});

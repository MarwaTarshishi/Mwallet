import api from './api';

class SettingsService {
    async getSettings() {
        return api.get('/user/settings');
    }

    async updateGeneralSettings(settings) {
        return api.put('/user/settings/general', settings);
    }

    async updatePassword(passwordData) {
        return api.put('/user/settings/password', passwordData);
    }

    async updateTwoFactor(twoFactorData) {
        return api.put('/user/settings/2fa', twoFactorData);
    }

    async updateNotifications(notificationSettings) {
        return api.put('/user/settings/notifications', notificationSettings);
    }

    async getActiveSessions() {
        return api.get('/user/sessions');
    }

    async terminateSession(sessionId) {
        return api.delete(`/user/sessions/${sessionId}`);
    }

    async terminateAllSessions() {
        return api.delete('/user/sessions');
    }

    async addPaymentMethod(paymentData) {
        return api.post('/user/payment-methods', paymentData);
    }

    async deletePaymentMethod(paymentMethodId) {
        return api.delete(`/user/payment-methods/${paymentMethodId}`);
    }

    async deleteAccount(reason) {
        return api.delete('/user/account', { data: { reason } });
    }
}

export default new SettingsService();


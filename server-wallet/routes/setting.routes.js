const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settings.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { settingsValidation } = require('../utils/validation');

// Protect all routes with authentication
router.use(auth);

// Settings Routes
router.get('/settings', SettingsController.getUserSettings);
router.put('/settings/personal', validate(settingsValidation.personalInfo), SettingsController.updatePersonalInfo);
router.put('/settings/password', validate(settingsValidation.password), SettingsController.updatePassword);
router.put('/settings/notifications', validate(settingsValidation.notifications), SettingsController.updateNotifications);
router.put('/settings/privacy', validate(settingsValidation.privacy), SettingsController.updatePrivacy);

// 2FA Routes
router.post('/settings/2fa/setup', SettingsController.setup2FA);
router.post('/settings/2fa/verify', validate(settingsValidation.twoFactor), SettingsController.verify2FA);
router.delete('/settings/2fa', SettingsController.disable2FA);

// Payment Methods
router.get('/settings/payment-methods', SettingsController.getPaymentMethods);
router.post('/settings/payment-methods', validate(settingsValidation.paymentMethod), SettingsController.addPaymentMethod);
router.delete('/settings/payment-methods/:id', SettingsController.removePaymentMethod);

// Account Management
router.delete('/settings/account', validate(settingsValidation.deleteAccount), SettingsController.deleteAccount);

module.exports = router;
// Apply authentication middleware to all routes
router.use(auth);

// Settings routes
router.get('/settings', SettingsController.getAllSettings);
router.put('/settings/preferences', validateSettings.preferences, SettingsController.updatePreferences);

// Payment methods routes
router.post('/payment-methods', validateSettings.paymentMethod, SettingsController.addPaymentMethod);
router.delete('/payment-methods/:paymentMethodId', SettingsController.deletePaymentMethod);
router.put('/payment-methods/:paymentMethodId/default', SettingsController.setDefaultPaymentMethod);

// Session management routes
router.get('/sessions', SettingsController.getSessions);
router.delete('/sessions/:sessionId', SettingsController.terminateSession);
router.delete('/sessions', SettingsController.terminateAllSessions);

// 2FA routes
router.post('/2fa/enable', SettingsController.enable2FA);
router.post('/2fa/verify', validateSettings.twoFactorToken, SettingsController.verify2FA);
router.delete('/2fa', SettingsController.disable2FA);

module.exports = router;


const db = require('../config/database');
const { ApiError } = require('../utils/errors');
const { encryptData, decryptData } = require('../utils/encryption');
const logger = require('../utils/logger');

class SettingsController {
    // Get all user settings
    static async getAllSettings(req, res, next) {
        try {
            const [settings] = await db.execute(`
                SELECT us.*, 
                       JSON_OBJECT(
                           'cards', (SELECT JSON_ARRAYAGG(
                               JSON_OBJECT(
                                   'id', pm.payment_method_id,
                                   'name', pm.name,
                                   'type', pm.type,
                                   'isDefault', pm.is_default,
                                   'details', pm.details,
                                   'status', pm.status
                               )
                           ) FROM payment_methods pm 
                           WHERE pm.user_id = us.user_id AND pm.type = 'card'),
                           'bankAccounts', (SELECT JSON_ARRAYAGG(
                               JSON_OBJECT(
                                   'id', pm.payment_method_id,
                                   'name', pm.name,
                                   'type', pm.type,
                                   'isDefault', pm.is_default,
                                   'details', pm.details,
                                   'status', pm.status
                               )
                           ) FROM payment_methods pm 
                           WHERE pm.user_id = us.user_id AND pm.type = 'bank_account')
                       ) as payment_methods,
                       (SELECT JSON_ARRAYAGG(
                           JSON_OBJECT(
                               'id', s.session_id,
                               'deviceType', s.device_type,
                               'deviceName', s.device_name,
                               'location', s.location,
                               'lastActive', s.last_active,
                               'isCurrent', s.is_current
                           )
                       ) FROM user_sessions s 
                       WHERE s.user_id = us.user_id) as active_sessions
                FROM user_settings us
                WHERE us.user_id = ?
            `, [req.user.id]);

            if (!settings) {
                throw new ApiError(404, 'Settings not found');
            }

            // Decrypt sensitive data
            if (settings.payment_methods) {
                settings.payment_methods = JSON.parse(settings.payment_methods);
                settings.payment_methods.cards = settings.payment_methods.cards?.map(card => ({
                    ...card,
                    details: decryptData(card.details)
                }));
                settings.payment_methods.bankAccounts = settings.payment_methods.bankAccounts?.map(account => ({
                    ...account,
                    details: decryptData(account.details)
                }));
            }

            res.json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(error);
        }
    }

    // Update user preferences
    static async updatePreferences(req, res, next) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { language, timezone, theme_preference, notification_preferences, privacy_settings } = req.body;

            await connection.execute(`
                UPDATE user_settings
                SET language = ?,
                    timezone = ?,
                    theme_preference = ?,
                    notification_preferences = ?,
                    privacy_settings = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `, [
                language,
                timezone,
                theme_preference,
                JSON.stringify(notification_preferences),
                JSON.stringify(privacy_settings),
                req.user.id
            ]);

            await connection.commit();

            logger.info(`User ${req.user.id} updated preferences`);

            res.json({
                success: true,
                message: 'Preferences updated successfully'
            });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    }

    // Add payment method
    static async addPaymentMethod(req, res, next) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { type, name, details, is_default } = req.body;

            // Encrypt sensitive payment details
            const encryptedDetails = encryptData(details);

            const [result] = await connection.execute(`
                INSERT INTO payment_methods (
                    user_id, type, name, details, is_default, status
                ) VALUES (?, ?, ?, ?, ?, 'active')
            `, [req.user.id, type, name, encryptedDetails, is_default]);

            if (is_default) {
                // Update other payment methods of same type to non-default
                await connection.execute(`
                    UPDATE payment_methods
                    SET is_default = 0
                    WHERE user_id = ? AND type = ? AND payment_method_id != ?
                `, [req.user.id, type, result.insertId]);
            }

            await connection.commit();

            logger.info(`User ${req.user.id} added new payment method`);

            res.json({
                success: true,
                message: 'Payment method added successfully',
                data: {
                    id: result.insertId
                }
            });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    }

    // Delete payment method
    static async deletePaymentMethod(req, res, next) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { paymentMethodId } = req.params;

            // Check if payment method exists and belongs to user
            const [paymentMethod] = await connection.execute(`
                SELECT * FROM payment_methods
                WHERE payment_method_id = ? AND user_id = ?
            `, [paymentMethodId, req.user.id]);

            if (!paymentMethod) {
                throw new ApiError(404, 'Payment method not found');
            }

            await connection.execute(`
                DELETE FROM payment_methods
                WHERE payment_method_id = ?
            `, [paymentMethodId]);

            await connection.commit();

            logger.info(`User ${req.user.id} deleted payment method ${paymentMethodId}`);

            res.json({
                success: true,
                message: 'Payment method deleted successfully'
            });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    }

    // Manage sessions
    static async getSessions(req, res, next) {
        try {
            const [sessions] = await db.execute(`
                SELECT session_id, device_type, device_name, 
                       ip_address, location, is_current, 
                       last_active, created_at
                FROM user_sessions
                WHERE user_id = ?
                ORDER BY last_active DESC
            `, [req.user.id]);

            res.json({
                success: true,
                data: sessions
            });
        } catch (error) {
            next(error);
        }
    }

    static async terminateSession(req, res, next) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { sessionId } = req.params;

            // Check if session exists and belongs to user
            const [session] = await connection.execute(`
                SELECT * FROM user_sessions
                WHERE session_id = ? AND user_id = ?
            `, [sessionId, req.user.id]);

            if (!session) {
                throw new ApiError(404, 'Session not found');
            }

            await connection.execute(`
                DELETE FROM user_sessions
                WHERE session_id = ?
            `, [sessionId]);

            await connection.commit();

            logger.info(`User ${req.user.id} terminated session ${sessionId}`);

            res.json({
                success: true,
                message: 'Session terminated successfully'
            });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    }

    static async terminateAllSessions(req, res, next) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Keep current session if specified
            const keepCurrent = req.query.keepCurrent === 'true';
            
            if (keepCurrent) {
                await connection.execute(`
                    DELETE FROM user_sessions
                    WHERE user_id = ? AND is_current = 0
                `, [req.user.id]);
            } else {
                await connection.execute(`
                    DELETE FROM user_sessions
                    WHERE user_id = ?
                `, [req.user.id]);
            }

            await connection.commit();

            logger.info(`User ${req.user.id} terminated all sessions`);

            res.json({
                success: true,
                message: 'All sessions terminated successfully'
            });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    }

    // Two-Factor Authentication
    static async enable2FA(req, res, next) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Generate secret and QR code
            const { secret, qrCode } = await generate2FASecret(req.user.email);

            // Store temporary secret
            await connection.execute(`
                UPDATE user_settings
                SET two_factor_secret = ?
                WHERE user_id = ?
            `, [secret, req.user.id]);

            await connection.commit();

            res.json({
                success: true,
                data: {
                    qrCode,
                    secret
                }
            });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    }

    static async verify2FA(req, res, next) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { token } = req.body;

            // Get user's temporary secret
            const [settings] = await connection.execute(`
                SELECT two_factor_secret
                FROM user_settings
                WHERE user_id = ?
            `, [req.user.id]);

            if (!settings?.two_factor_secret) {
                throw new ApiError(400, '2FA setup not initiated');
            }

            // Verify token
            const isValid = verify2FAToken(token, settings.two_factor_secret);
            if (!isValid) {
                throw new ApiError(400, 'Invalid verification code');
            }

            // Enable 2FA
            await connection.execute(`
                UPDATE user_settings
                SET two_factor_enabled = 1
                WHERE user_id = ?
            `, [req.user.id]);

            await connection.commit();

            logger.info(`User ${req.user.id} enabled 2FA`);

            res.json({
                success: true,
                message: '2FA enabled successfully'
            });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    }
}
module.exports = SettingsController;
const db = require('../config/database');
const { generateQRCode } = require('../utils/twoFactor');
const { hashPassword, comparePassword } = require('../utils/crypto');
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

class SettingsController {
    static async getUserSettings(req, res, next) {
        try {
            const [user] = await db.execute(
                `SELECT user_id, first_name, last_name, email, phone, 
                        language, currency, timezone, notification_preferences, 
                        privacy_settings, is_two_factor_enabled
                 FROM users WHERE user_id = ?`,
                [req.user.id]
            );

            if (!user) {
                throw new ApiError(404, 'User not found');
            }

            const [paymentMethods] = await db.execute(
                'SELECT * FROM payment_methods WHERE user_id = ?',
                [req.user.id]
            );

            res.json({
                success: true,
                data: {
                    personalInfo: {
                        firstName: user.first_name,
                        lastName: user.last_name,
                        email: user.email,
                        phone: user.phone
                    },
                    preferences: {
                        language: user.language,
                        currency: user.currency,
                        timezone: user.timezone
                    },
                    notifications: JSON.parse(user.notification_preferences),
                    privacy: JSON.parse(user.privacy_settings),
                    twoFactorEnabled: user.is_two_factor_enabled,
                    paymentMethods
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async updatePersonalInfo(req, res, next) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { firstName, lastName, phone } = req.body;

            await connection.execute(
                `UPDATE users 
                 SET first_name = ?, last_name = ?, phone = ?, updated_at = NOW()
                 WHERE user_id = ?`,
                [firstName, lastName, phone, req.user.id]
            );

            await connection.commit();

            logger.info(`User ${req.user.id} updated personal information`);

            res.json({
                success: true,
                message: 'Personal information updated successfully'
            });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    }

    static async updatePassword(req, res, next) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { currentPassword, newPassword } = req.body;

            // Get current user's password
            const [user] = await connection.execute(
                'SELECT password FROM users WHERE user_id = ?',
                [req.user.id]
            );

            // Verify current password
            const isValid = await comparePassword(currentPassword, user.password);
            if (!isValid) {
                throw new ApiError(401, 'Current password is incorrect');
            }

            // Hash new password
            const hashedPassword = await hashPassword(newPassword);

            // Update password
            await connection.execute(
                'UPDATE users SET password = ?, updated_at = NOW() WHERE user_id = ?',
                [hashedPassword, req.user.id]
            );

            await connection.commit();

            logger.info(`User ${req.user.id} changed password`);

            res.json({
                success: true,
                message: 'Password updated successfully'
            });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    }

    static async setup2FA(req, res, next) {
        try {
            const { qrCode, secret } = await generateQRCode(req.user.email);

            // Store temporary secret
            await db.execute(
                'UPDATE users SET temp_2fa_secret = ? WHERE user_id = ?',
                [secret, req.user.id]
            );

            res.json({
                success: true,
                data: { qrCode }
            });
        } catch (error) {
            next(error);
        }
    }

    static async addPaymentMethod(req, res, next) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { type, data } = req.body;

            // Encrypt sensitive data before storing
            const encryptedData = await encryptPaymentData(data);

            await connection.execute(
                `INSERT INTO payment_methods (user_id, type, data, created_at)
                 VALUES (?, ?, ?, NOW())`,
                [req.user.id, type, encryptedData]
            );

            await connection.commit();

            logger.info(`User ${req.user.id} added new payment method`);

            res.json({
                success: true,
                message: 'Payment method added successfully'
            });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    }

    static async deleteAccount(req, res, next) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { password, reason } = req.body;

            // Verify password
            const [user] = await connection.execute(
                'SELECT password FROM users WHERE user_id = ?',
                [req.user.id]
            );

            const isValid = await comparePassword(password, user.password);
            if (!isValid) {
                throw new ApiError(401, 'Invalid password');
            }

            // Log deletion reason
            await connection.execute(
                `INSERT INTO account_deletions (user_id, reason, deleted_at)
                 VALUES (?, ?, NOW())`,
                [req.user.id, reason]
            );

            // Delete user data
            await connection.execute(
                'DELETE FROM users WHERE user_id = ?',
                [req.user.id]
            );

            await connection.commit();

            logger.warn(`User ${req.user.id} deleted their account. Reason: ${reason}`);

            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        } catch (error) {
            await connection.rollback();
            next(error);
        } finally {
            connection.release();
        }
    }
}

module.exports = SettingsController;

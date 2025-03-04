const { ValidationError } = require('../utils/errors');

const validate = (schema) => {
    return (req, res, next) => {
        try {
            const { error } = schema.validate(req.body, { abortEarly: false });
            if (error) {
                const errors = error.details.map(detail => detail.message);
                throw new ValidationError(errors);
            }
            next();
        } catch (err) {
            next(err);
        }
    };
};

module.exports = validate;
const Joi = require('joi');

const validateSettings = {
    preferences: Joi.object({
        language: Joi.string().valid('en', 'es', 'fr').required(),
        timezone: Joi.string().required(),
        theme_preference: Joi.string().valid('light', 'dark').required(),
        notification_preferences: Joi.object({
            email: Joi.object({
                transactions: Joi.boolean(),
                security: Joi.boolean(),
                marketing: Joi.boolean()
            }),
            push: Joi.object({
                transactions: Joi.boolean(),
                security: Joi.boolean()
            })
        }).required(),
        privacy_settings: Joi.object({
            profile_visible: Joi.boolean(),
            activity_visible: Joi.boolean(),
            show_balance: Joi.boolean()
        }).required()
    }),

    paymentMethod: Joi.object({
        type: Joi.string().valid('card', 'bank_account').required(),
        name: Joi.string().required(),
        details: Joi.object().required(),
        is_default: Joi.boolean().default(false)
    }),

    twoFactorToken: Joi.object({
        token: Joi.string().length(6).pattern(/^\d+$/).required()
    })
};

module.exports = validateSettings;


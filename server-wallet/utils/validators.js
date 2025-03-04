const settingsValidation = {
    personalInfo: Joi.object({
        firstName: Joi.string().min(2).max(50).required(),
        lastName: Joi.string().min(2).max(50).required(),
        phone: Joi.string().pattern(/^\+?[\d\s-]{10,}$/).allow(''),
    }),

    password: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .required()
            .messages({
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
            }),
        confirmPassword: Joi.ref('newPassword')
    }),

    notifications: Joi.object({
        email: Joi.object({
            transactions: Joi.boolean(),
            security: Joi.boolean(),
            marketing: Joi.boolean()
        }),
        push: Joi.object({
            transactions: Joi.boolean(),
            security: Joi.boolean()
        })
    }),

    paymentMethod: Joi.object({
        type: Joi.string().valid('card', 'bank').required(),
        data: Joi.object().required()
    }),

    deleteAccount: Joi.object({
        password: Joi.string().required(),
        reason: Joi.string().required(),
        confirmation: Joi.boolean().valid(true).required()
    })
};

module.exports = {
    settingsValidation
};


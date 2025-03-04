const logger = require('../utils/logger');
const { ApiError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
    logger.error(err);

    if (err instanceof ApiError) {
        return res.status(err.status).json({
            success: false,
            message: err.message,
            errors: err.errors
        });
    }

    // Database errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
            success: false,
            message: 'Duplicate entry found',
            error: 'A record with this information already exists'
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
};

module.exports = errorHandler;


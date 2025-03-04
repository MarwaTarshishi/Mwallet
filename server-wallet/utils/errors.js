class ApiError extends Error {
    constructor(status, message, errors = []) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}

class ValidationError extends ApiError {
    constructor(errors) {
        super(400, 'Validation Error', errors);
    }
}

class AuthenticationError extends ApiError {
    constructor(message = 'Authentication failed') {
        super(401, message);
    }
}

class ForbiddenError extends ApiError {
    constructor(message = 'Access denied') {
        super(403, message);
    }
}

module.exports = {
    ApiError,
    ValidationError,
    AuthenticationError,
    ForbiddenError
};

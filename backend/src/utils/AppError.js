// Error carrying an HTTP status + stable code, serialised by the error middleware.
export class AppError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

export const Errors = {
  validation: (message = 'Validation failed', details) => new AppError(400, 'VALIDATION_ERROR', message, details),
  unauthorized: (message = 'Authentication required') => new AppError(401, 'UNAUTHORIZED', message),
  invalidCredentials: (message = 'Invalid email or password') => new AppError(401, 'INVALID_CREDENTIALS', message),
  forbidden: (message = 'You do not have permission to perform this action') => new AppError(403, 'FORBIDDEN', message),
  notFound: (message = 'Resource not found') => new AppError(404, 'NOT_FOUND', message),
  conflict: (message = 'Resource already exists') => new AppError(409, 'CONFLICT', message),
  internal: (message = 'Internal server error') => new AppError(500, 'INTERNAL_ERROR', message),
};

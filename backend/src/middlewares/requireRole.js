import { Errors } from '../utils/AppError.js';

// Pure role gate. All role checks live in middleware, never in controllers.
export const requireRole = (allowedRoles) => (req, _res, next) => {
  if (!req.user) return next(Errors.unauthorized());
  if (!allowedRoles.includes(req.user.role)) {
    return next(Errors.forbidden(`This action requires one of the following roles: ${allowedRoles.join(', ')}`));
  }
  next();
};

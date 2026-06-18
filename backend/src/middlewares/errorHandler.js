import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError.js';
import { isProduction } from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`));
}

// Centralized error envelope: { status, code, message, details? }.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    const body = { status: err.status, code: err.code, message: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.status).json(body);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return res.status(409).json({ status: 409, code: 'CONFLICT', message: 'A record with this value already exists' });
    if (err.code === 'P2025') return res.status(404).json({ status: 404, code: 'NOT_FOUND', message: 'Resource not found' });
    if (err.code === 'P2003') return res.status(400).json({ status: 400, code: 'VALIDATION_ERROR', message: 'Referenced record does not exist' });
  }

  console.error('[error]', err);
  return res.status(500).json({
    status: 500,
    code: 'INTERNAL_ERROR',
    message: isProduction ? 'Internal server error' : err.message,
  });
}

import { verifyAccessToken } from '../utils/tokens.js';
import { Errors } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Verifies the Bearer access token and attaches req.user.
export const authenticate = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw Errors.unauthorized('Missing or malformed Authorization header');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw Errors.unauthorized(err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token');
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    organizationId: payload.organizationId,
  };
  next();
});

import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { isProduction } from '../config/env.js';

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function readRefreshToken(req) {
  return req.body?.refreshToken || req.cookies?.refreshToken || null;
}

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);
  res.status(200).json(result);
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(readRefreshToken(req));
  res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);
  res.status(200).json(result);
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(readRefreshToken(req));
  res.clearCookie('refreshToken', { ...refreshCookieOptions, maxAge: undefined });
  res.status(200).json({ message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});

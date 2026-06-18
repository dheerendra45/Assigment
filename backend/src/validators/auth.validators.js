import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    organizationName: z.string().trim().min(2, 'organizationName must be at least 2 characters').max(100),
    name: z.string().trim().min(2, 'name must be at least 2 characters').max(100),
    email: z.string().trim().toLowerCase().email('email must be a valid email address'),
    password: z.string().min(8, 'password must be at least 8 characters').max(128),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('email must be a valid email address'),
    password: z.string().min(1, 'password is required'),
  }),
};

// refresh/logout read the token from a cookie or the body.
export const refreshSchema = {
  body: z.object({ refreshToken: z.string().min(1).optional() }).optional().default({}),
};

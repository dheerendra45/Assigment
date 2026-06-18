import { z } from 'zod';

const ROLES = ['ADMIN', 'MANAGER', 'MEMBER'];
const uuid = z.string().uuid('must be a valid uuid');

export const createUserSchema = {
  body: z.object({
    name: z.string().trim().min(2, 'name must be at least 2 characters').max(100),
    email: z.string().trim().toLowerCase().email('email must be a valid email address'),
    password: z.string().min(8, 'password must be at least 8 characters').max(128),
    role: z.enum(ROLES, { message: `role must be one of ${ROLES.join(', ')}` }).optional(),
  }),
};

export const updateUserRoleSchema = {
  params: z.object({ id: uuid }),
  body: z.object({
    role: z.enum(ROLES, { message: `role must be one of ${ROLES.join(', ')}` }),
  }),
};

export const userIdSchema = {
  params: z.object({ id: uuid }),
};

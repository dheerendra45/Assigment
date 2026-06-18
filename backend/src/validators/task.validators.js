import { z } from 'zod';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];
const uuid = z.string().uuid('must be a valid uuid');

// ISO datetime that must be in the future.
const futureDate = z
  .string()
  .datetime({ message: 'due_date must be an ISO 8601 datetime' })
  .refine((v) => new Date(v) > new Date(), { message: 'due_date must be a future date' });

export const createTaskSchema = {
  body: z.object({
    title: z.string().trim().min(1, 'title is required').max(200, 'title must be at most 200 characters'),
    description: z.string().trim().max(5000, 'description too long').optional(),
    priority: z.enum(PRIORITIES, { message: `priority must be one of ${PRIORITIES.join(', ')}` }).optional(),
    status: z.enum(STATUSES, { message: `status must be one of ${STATUSES.join(', ')}` }).optional(),
    assigneeId: uuid.optional().nullable(),
    dueDate: futureDate.optional().nullable(),
  }),
};

export const updateTaskSchema = {
  params: z.object({ id: uuid }),
  body: z
    .object({
      title: z.string().trim().min(1, 'title cannot be empty').max(200).optional(),
      description: z.string().trim().max(5000).optional().nullable(),
      priority: z.enum(PRIORITIES, { message: `priority must be one of ${PRIORITIES.join(', ')}` }).optional(),
      assigneeId: uuid.optional().nullable(),
      dueDate: futureDate.optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
};

export const updateStatusSchema = {
  params: z.object({ id: uuid }),
  body: z.object({
    status: z.enum(STATUSES, { message: `status must be one of ${STATUSES.join(', ')}` }),
  }),
};

export const taskIdSchema = { params: z.object({ id: uuid }) };

export const listTasksSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(STATUSES, { message: `status must be one of ${STATUSES.join(', ')}` }).optional(),
    priority: z.enum(PRIORITIES, { message: `priority must be one of ${PRIORITIES.join(', ')}` }).optional(),
    assignee: uuid.optional(),
  }),
};

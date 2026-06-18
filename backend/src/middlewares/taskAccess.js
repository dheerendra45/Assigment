import { prisma } from '../config/prisma.js';
import { Errors } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const PRIVILEGED = ['ADMIN', 'MANAGER'];

// Loads the task scoped to the caller's org (404 if outside it), onto req.task.
export const loadTask = asyncHandler(async (req, _res, next) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
    include: { assignee: { select: { id: true, name: true, email: true, role: true } } },
  });
  if (!task) throw Errors.notFound('Task not found');
  req.task = task;
  next();
});

// Shared rule: ADMIN/MANAGER reach any task in the org; a MEMBER only their own.
const canAccessTask = (user, task) => PRIVILEGED.includes(user.role) || task.assigneeId === user.id;

// ADMIN/MANAGER may mutate any task in the org; a MEMBER only their own.
export const authorizeTaskMutation = (req, _res, next) => {
  if (!canAccessTask(req.user, req.task)) {
    return next(Errors.forbidden('Only the task assignee, a MANAGER or an ADMIN can modify this task'));
  }
  next();
};

// Same ownership rule for reads: a MEMBER can only view tasks assigned to them.
export const authorizeTaskRead = (req, _res, next) => {
  if (!canAccessTask(req.user, req.task)) {
    return next(Errors.forbidden('A MEMBER can only view tasks assigned to them'));
  }
  next();
};

// A MEMBER's task list is forced to their own tasks.
export const scopeTaskList = (req, _res, next) => {
  const query = req.validatedQuery ?? {};
  if (req.user.role === 'MEMBER') query.assignee = req.user.id;
  req.validatedQuery = query;
  next();
};

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

// ADMIN/MANAGER may mutate any task in the org; a MEMBER only their own.
export const authorizeTaskMutation = (req, _res, next) => {
  const isPrivileged = PRIVILEGED.includes(req.user.role);
  const isAssignee = req.task.assigneeId === req.user.id;
  if (!isPrivileged && !isAssignee) {
    return next(Errors.forbidden('Only the task assignee, a MANAGER or an ADMIN can modify this task'));
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

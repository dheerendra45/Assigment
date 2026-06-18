import { prisma } from '../config/prisma.js';
import { Errors } from '../utils/AppError.js';
import { assertValidTransition } from './stateMachine.js';
import { assigneeListKey, getCachedList, setCachedList, invalidateAssignee } from './cache.service.js';

const taskInclude = { assignee: { select: { id: true, name: true, email: true, role: true } } };

// Cacheable = a single-assignee list with no other filters (the per-assignee list).
function isCacheable(filters) {
  return Boolean(filters.assignee) && !filters.status && !filters.priority;
}

export async function listTasks(organizationId, filters) {
  const { page, limit, status, priority, assignee } = filters;
  const skip = (page - 1) * limit;
  const cacheKey = isCacheable(filters) ? assigneeListKey(assignee, page, limit) : null;

  if (cacheKey) {
    const cached = await getCachedList(cacheKey);
    if (cached) return { ...cached, cached: true };
  }

  const where = {
    organizationId,
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(assignee ? { assigneeId: assignee } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.task.findMany({ where, include: taskInclude, orderBy: [{ createdAt: 'desc' }], skip, take: limit }),
    prisma.task.count({ where }),
  ]);

  const result = {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
      hasNextPage: skip + items.length < total,
      hasPrevPage: page > 1,
    },
    cached: false,
  };

  if (cacheKey) await setCachedList(cacheKey, { data: result.data, pagination: result.pagination });
  return result;
}

export async function createTask(organizationId, input) {
  if (input.assigneeId) await assertAssigneeInOrg(organizationId, input.assigneeId);
  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? 'MEDIUM',
      status: input.status ?? 'TODO',
      assigneeId: input.assigneeId ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      organizationId,
    },
    include: taskInclude,
  });
  await invalidateAssignee(task.assigneeId);
  return task;
}

export async function updateTask(existing, input) {
  if (input.assigneeId) await assertAssigneeInOrg(existing.organizationId, input.assigneeId);
  const data = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.assigneeId !== undefined) data.assigneeId = input.assigneeId;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null;

  const task = await prisma.task.update({ where: { id: existing.id }, data, include: taskInclude });
  await invalidateAssignee(existing.assigneeId, task.assigneeId);
  return task;
}

export async function changeStatus(existing, nextStatus) {
  assertValidTransition(existing.status, nextStatus);
  const task = await prisma.task.update({ where: { id: existing.id }, data: { status: nextStatus }, include: taskInclude });
  await invalidateAssignee(task.assigneeId);
  return task;
}

export async function deleteTask(existing) {
  await prisma.task.delete({ where: { id: existing.id } });
  await invalidateAssignee(existing.assigneeId);
}

async function assertAssigneeInOrg(organizationId, assigneeId) {
  const user = await prisma.user.findFirst({ where: { id: assigneeId, organizationId }, select: { id: true } });
  if (!user) throw Errors.validation('assigneeId must reference a user in your organization');
}

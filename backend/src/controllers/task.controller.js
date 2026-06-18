import { asyncHandler } from '../utils/asyncHandler.js';
import * as taskService from '../services/task.service.js';

// Controllers hold zero role/ownership logic — that is all enforced by middleware.
export const listTasks = asyncHandler(async (req, res) => {
  res.status(200).json(await taskService.listTasks(req.user.organizationId, req.validatedQuery));
});

export const getTask = asyncHandler(async (req, res) => {
  res.status(200).json({ data: req.task });
});

export const createTask = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await taskService.createTask(req.user.organizationId, req.body) });
});

export const updateTask = asyncHandler(async (req, res) => {
  res.status(200).json({ data: await taskService.updateTask(req.task, req.body) });
});

export const updateStatus = asyncHandler(async (req, res) => {
  res.status(200).json({ data: await taskService.changeStatus(req.task, req.body.status) });
});

export const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.task);
  res.status(204).send();
});

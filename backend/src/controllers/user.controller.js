import { asyncHandler } from '../utils/asyncHandler.js';
import * as userService from '../services/user.service.js';

export const listUsers = asyncHandler(async (req, res) => {
  res.status(200).json({ data: await userService.listUsers(req.user.organizationId) });
});

export const createUser = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await userService.createUser(req.user.organizationId, req.body) });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  res.status(200).json({ data: await userService.updateUserRole(req.user.organizationId, req.params.id, req.body.role) });
});

export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.user.organizationId, req.params.id, req.user.id);
  res.status(204).send();
});

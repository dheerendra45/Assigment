import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { loadTask, authorizeTaskMutation, authorizeTaskRead, scopeTaskList } from '../middlewares/taskAccess.js';
import {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  taskIdSchema,
  listTasksSchema,
} from '../validators/task.validators.js';
import * as task from '../controllers/task.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(listTasksSchema), scopeTaskList, task.listTasks);
router.get('/:id', validate(taskIdSchema), loadTask, authorizeTaskRead, task.getTask);
router.post('/', requireRole(['ADMIN', 'MANAGER']), validate(createTaskSchema), task.createTask);
router.put('/:id', validate(updateTaskSchema), loadTask, authorizeTaskMutation, task.updateTask);
router.patch('/:id/status', validate(updateStatusSchema), loadTask, authorizeTaskMutation, task.updateStatus);
router.delete('/:id', requireRole(['ADMIN', 'MANAGER']), validate(taskIdSchema), loadTask, task.deleteTask);

export default router;

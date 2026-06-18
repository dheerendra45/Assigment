import { Errors } from '../utils/AppError.js';

// TODO -> IN_PROGRESS -> IN_REVIEW -> DONE; BLOCKED from any active state.
const TRANSITIONS = {
  TODO: ['IN_PROGRESS', 'BLOCKED'],
  IN_PROGRESS: ['IN_REVIEW', 'BLOCKED'],
  IN_REVIEW: ['DONE', 'IN_PROGRESS', 'BLOCKED'],
  DONE: [],
  BLOCKED: ['IN_PROGRESS', 'TODO'],
};

export function allowedNextStatuses(current) {
  return TRANSITIONS[current] ?? [];
}

export function assertValidTransition(current, next) {
  if (current === next) throw Errors.validation(`Task is already in status ${current}`);
  if (!allowedNextStatuses(current).includes(next)) {
    throw Errors.validation(
      `Invalid status transition: ${current} -> ${next}. Allowed: ${allowedNextStatuses(current).join(', ') || '(none, status is terminal)'}`,
    );
  }
}

export { TRANSITIONS };

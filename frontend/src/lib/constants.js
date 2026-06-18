export const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

// Mirrors the backend state machine; server stays the real enforcer.
export const TRANSITIONS = {
  TODO: ['IN_PROGRESS', 'BLOCKED'],
  IN_PROGRESS: ['IN_REVIEW', 'BLOCKED'],
  IN_REVIEW: ['DONE', 'IN_PROGRESS', 'BLOCKED'],
  DONE: [],
  BLOCKED: ['IN_PROGRESS', 'TODO'],
};

export const STATUS_META = {
  TODO: { label: 'To Do', accent: 'from-slate-400 to-slate-500', dot: 'bg-slate-400', ring: 'ring-slate-400/30' },
  IN_PROGRESS: { label: 'In Progress', accent: 'from-sky-400 to-blue-500', dot: 'bg-sky-400', ring: 'ring-sky-400/30' },
  IN_REVIEW: { label: 'In Review', accent: 'from-amber-400 to-orange-500', dot: 'bg-amber-400', ring: 'ring-amber-400/30' },
  DONE: { label: 'Done', accent: 'from-emerald-400 to-green-500', dot: 'bg-emerald-400', ring: 'ring-emerald-400/30' },
  BLOCKED: { label: 'Blocked', accent: 'from-rose-400 to-red-500', dot: 'bg-rose-400', ring: 'ring-rose-400/30' },
};

export const PRIORITY_META = {
  LOW: { label: 'Low', cls: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/20' },
  MEDIUM: { label: 'Medium', cls: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20' },
  HIGH: { label: 'High', cls: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/20' },
};

export const ROLE_META = {
  ADMIN: 'bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-400/20',
  MANAGER: 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20',
  MEMBER: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/20',
};

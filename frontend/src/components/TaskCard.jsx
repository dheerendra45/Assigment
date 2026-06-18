import { motion } from 'framer-motion';
import { PRIORITY_META, STATUS_META, TRANSITIONS } from '../lib/constants.js';

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(task) {
  return task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date();
}

export default function TaskCard({ task, canMutate, onAdvance, onEdit, onDelete, busy }) {
  const transitions = TRANSITIONS[task.status] || [];
  const overdue = isOverdue(task);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="glass group rounded-2xl p-4 shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug text-slate-100">{task.title}</h4>
        <span className={`chip ${PRIORITY_META[task.priority].cls} shrink-0`}>
          {PRIORITY_META[task.priority].label}
        </span>
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-slate-400">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        {task.assignee ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[9px] font-bold text-white">
              {task.assignee.name?.[0]?.toUpperCase() || '?'}
            </span>
            {task.assignee.name}
          </span>
        ) : (
          <span className="italic text-slate-500">Unassigned</span>
        )}
        {task.dueDate && (
          <span className={`inline-flex items-center gap-1 ${overdue ? 'text-rose-300' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {formatDate(task.dueDate)}
            {overdue && ' · overdue'}
          </span>
        )}
      </div>

      {/* Only valid transitions are shown; server still enforces. */}
      {canMutate && (transitions.length > 0 || onEdit) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3">
          {transitions.map((next) => (
            <button
              key={next}
              disabled={busy}
              onClick={() => onAdvance(task, next)}
              className={`inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-200 ring-1 ${STATUS_META[next].ring} transition hover:bg-white/10 disabled:opacity-40`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[next].dot}`} />
              {STATUS_META[next].label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            {onEdit && (
              <button onClick={() => onEdit(task)} title="Edit" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(task)} title="Delete" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

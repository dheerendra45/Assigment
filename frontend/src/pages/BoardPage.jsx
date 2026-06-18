import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, ApiError } from '../lib/api.js';
import { PRIORITIES, ROLE_META, STATUSES, STATUS_META } from '../lib/constants.js';
import TaskCard from '../components/TaskCard.jsx';
import TaskModal from '../components/TaskModal.jsx';
import AnalyticsPanel from '../components/AnalyticsPanel.jsx';

const PAGE_SIZE = 50;

export default function BoardPage() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const isPrivileged = user.role === 'ADMIN' || user.role === 'MANAGER';

  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '', assignee: '', page: 1 });
  const [modal, setModal] = useState({ open: false, task: null });
  const [busyId, setBusyId] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listTasks({
        status: filters.status,
        priority: filters.priority,
        assignee: filters.assignee,
        page: filters.page,
        limit: PAGE_SIZE,
      });
      setTasks(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (isPrivileged) {
      api.listUsers().then((r) => setMembers(r.data)).catch(() => {});
    }
  }, [isPrivileged]);

  const grouped = useMemo(() => {
    const g = Object.fromEntries(STATUSES.map((s) => [s, []]));
    tasks.forEach((t) => g[t.status]?.push(t));
    return g;
  }, [tasks]);

  function canMutate(task) {
    return isPrivileged || task.assignee?.id === user.id;
  }

  async function advance(task, next) {
    setBusyId(task.id);
    try {
      await api.updateStatus(task.id, next);
      toast.success(`Moved to ${STATUS_META[next].label}`);
      await loadTasks();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update status');
    } finally {
      setBusyId(null);
    }
  }

  async function saveTask(payload) {
    try {
      if (modal.task) {
        await api.updateTask(modal.task.id, payload);
        toast.success('Task updated');
      } else {
        await api.createTask(payload);
        toast.success('Task created');
      }
      setModal({ open: false, task: null });
      await loadTasks();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.details ? err.details[0].message : err.message);
      } else toast.error('Save failed');
    }
  }

  async function removeTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.deleteTask(task.id);
      toast.success('Task deleted');
      await loadTasks();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v, page: 1 }));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="glass flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-glow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">TaskFlow</h1>
            <p className="text-xs text-slate-400">{pagination.total} tasks · {user.email}</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className={`chip ${ROLE_META[user.role]}`}>{user.role}</span>
          {isPrivileged && (
            <button onClick={() => setShowAnalytics(true)} className="btn-ghost">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M7 14l4-4 3 3 5-6" /></svg>
              Analytics
            </button>
          )}
          {isPrivileged && (
            <button onClick={() => setModal({ open: true, task: null })} className="btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
              New task
            </button>
          )}
          <button onClick={logout} title="Sign out" className="btn-ghost !px-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Select value={filters.status} onChange={(v) => setFilter('status', v)} placeholder="All statuses" options={STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))} />
        <Select value={filters.priority} onChange={(v) => setFilter('priority', v)} placeholder="All priorities" options={PRIORITIES.map((p) => ({ value: p, label: p }))} />
        {isPrivileged && (
          <Select value={filters.assignee} onChange={(v) => setFilter('assignee', v)} placeholder="All assignees" options={members.map((m) => ({ value: m.id, label: m.name }))} />
        )}
        {(filters.status || filters.priority || filters.assignee) && (
          <button onClick={() => setFilters({ status: '', priority: '', assignee: '', page: 1 })} className="btn-ghost text-xs">Clear</button>
        )}
        <div className="ml-auto flex items-center gap-2 text-sm text-slate-400">
          <button disabled={pagination.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} className="btn-ghost !px-2.5">‹</button>
          <span>Page {pagination.page} / {pagination.totalPages || 1}</span>
          <button disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} className="btn-ghost !px-2.5">›</button>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <BoardSkeleton />
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STATUSES.map((status) => (
            <div key={status} className="flex min-h-[60vh] flex-col rounded-2xl bg-white/[0.02] p-3 ring-1 ring-white/5">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[status].dot}`} />
                  <h3 className="text-sm font-semibold">{STATUS_META[status].label}</h3>
                </div>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-400">{grouped[status].length}</span>
              </div>
              <div className="scroll-thin flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {grouped[status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      busy={busyId === task.id}
                      canMutate={canMutate(task)}
                      onAdvance={advance}
                      onEdit={isPrivileged ? (t) => setModal({ open: true, task: t }) : undefined}
                      onDelete={isPrivileged ? removeTask : undefined}
                    />
                  ))}
                </AnimatePresence>
                {grouped[status].length === 0 && (
                  <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-white/5 text-xs text-slate-600">
                    Empty
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskModal
        open={modal.open}
        task={modal.task}
        members={members}
        onClose={() => setModal({ open: false, task: null })}
        onSubmit={saveTask}
      />

      <AnalyticsPanel open={showAnalytics} onClose={() => setShowAnalytics(false)} />
    </div>
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input !w-auto !py-2 text-sm">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function BoardSkeleton() {
  return (
    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {STATUSES.map((s) => (
        <div key={s} className="min-h-[60vh] rounded-2xl bg-white/[0.02] p-3 ring-1 ring-white/5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-3 h-24 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ))}
    </div>
  );
}

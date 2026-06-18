import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PRIORITIES } from '../lib/constants.js';

// Create / edit task modal. `task` null => create mode.
export default function TaskModal({ open, task, members, onClose, onSubmit }) {
  const editing = Boolean(task);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', assigneeId: '', dueDate: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        title: task?.title || '',
        description: task?.description || '',
        priority: task?.priority || 'MEDIUM',
        assigneeId: task?.assignee?.id || task?.assigneeId || '',
        dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
      });
    }
  }, [open, task]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      assigneeId: form.assigneeId || null,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    };
    try {
      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="glass relative w-full max-w-lg rounded-3xl p-6 shadow-card"
          >
            <h3 className="text-lg font-bold">{editing ? 'Edit task' : 'New task'}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label">Title</label>
                <input className="input" autoFocus required value={form.title} onChange={set('title')} placeholder="Ship the onboarding flow" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[88px] resize-none" value={form.description} onChange={set('description')} placeholder="Optional details…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={form.priority} onChange={set('priority')}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Due date</label>
                  <input className="input" type="date" value={form.dueDate} onChange={set('dueDate')} />
                </div>
              </div>
              <div>
                <label className="label">Assignee</label>
                <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create task'}</button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../lib/api.js';

// Slide-over panel showing the /analytics aggregation (ADMIN/MANAGER).
export default function AnalyticsPanel({ open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      api.analytics().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
    }
  }, [open]);

  const maxOverdue = Math.max(1, ...(data?.perUser || []).map((u) => u.overdueCount));

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="glass absolute right-0 top-0 flex h-full w-full max-w-md flex-col p-6 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Team analytics</h2>
                <p className="text-xs text-slate-400">Overdue load &amp; avg completion time</p>
              </div>
              <button onClick={onClose} className="btn-ghost !px-2.5">✕</button>
            </div>

            {loading && <p className="mt-8 text-sm text-slate-400">Loading…</p>}

            {data && (
              <>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Stat label="Total overdue" value={data.totalOverdue} accent="text-rose-300" />
                  <Stat label="Team members" value={data.perUser.length} accent="text-indigo-300" />
                </div>

                <div className="scroll-thin mt-6 flex-1 space-y-3 overflow-y-auto pr-1">
                  {data.perUser.map((u) => (
                    <div key={u.userId} className="glass rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-bold text-white">
                            {u.name?.[0]?.toUpperCase()}
                          </span>
                          <div>
                            <p className="text-sm font-semibold">{u.name}</p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                        <span className="text-right text-xs text-slate-400">
                          {u.completedCount} done
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-xs">
                        <div className="flex-1">
                          <div className="mb-1 flex justify-between text-slate-400">
                            <span>Overdue</span><span className="font-semibold text-rose-300">{u.overdueCount}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-red-500" style={{ width: `${(u.overdueCount / maxOverdue) * 100}%` }} />
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-slate-400">Avg done</div>
                          <div className="font-semibold text-slate-200">{u.avgCompletionHours}h</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[11px] text-slate-600">Generated {new Date(data.generatedAt).toLocaleString()}</p>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${accent}`}>{value}</p>
    </div>
  );
}

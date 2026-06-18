import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ApiError } from '../lib/api.js';

const DEMO = [
  { role: 'Admin', email: 'admin@acme.test' },
  { role: 'Manager', email: 'manager@acme.test' },
  { role: 'Member', email: 'member@acme.test' },
];

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    organizationName: '',
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      if (isRegister) {
        await register(form);
        toast.success('Organization created — welcome aboard!');
      } else {
        await login({ email: form.email, password: form.password });
        toast.success('Welcome back!');
      }
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details) {
          const map = {};
          err.details.forEach((d) => (map[d.field] = d.message));
          setErrors(map);
        }
        toast.error(err.message);
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(email) {
    setForm((f) => ({ ...f, email, password: 'Password123' }));
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-lg font-bold tracking-tight">TaskFlow</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-md"
        >
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
            Where teams turn <span className="text-gradient">tasks</span> into momentum.
          </h1>
          <p className="mt-5 text-lg text-slate-400">
            Role-based boards, a strict status workflow, and lightning-fast cached views — built for
            teams that ship.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['JWT auth + rotation', 'RBAC', 'Redis cache', 'State machine'].map((t) => (
              <span key={t} className="chip glass text-slate-300">
                {t}
              </span>
            ))}
          </div>
        </motion.div>
        <div className="text-sm text-slate-500">© {new Date().getFullYear()} TaskFlow · Demo build</div>
        <FloatingOrbs />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="glass w-full max-w-md rounded-3xl p-8 shadow-card"
        >
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <Logo />
            <span className="text-lg font-bold">TaskFlow</span>
          </div>
          <h2 className="text-2xl font-bold">{isRegister ? 'Create your workspace' : 'Sign in'}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {isRegister
              ? 'Your account becomes the organization ADMIN.'
              : 'Welcome back. Enter your details to continue.'}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {isRegister && (
              <>
                <Field label="Organization" error={errors.organizationName}>
                  <input className="input" placeholder="Acme Inc." value={form.organizationName} onChange={set('organizationName')} />
                </Field>
                <Field label="Your name" error={errors.name}>
                  <input className="input" placeholder="Jane Doe" value={form.name} onChange={set('name')} />
                </Field>
              </>
            )}
            <Field label="Email" error={errors.email}>
              <input className="input" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Password" error={errors.password}>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
            </Field>

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner /> : isRegister ? 'Create workspace' : 'Sign in'}
            </button>
          </form>

          {!isRegister && (
            <div className="mt-6">
              <p className="mb-2 text-center text-xs uppercase tracking-wide text-slate-500">Demo accounts (password: Password123)</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO.map((d) => (
                  <button key={d.email} onClick={() => fillDemo(d.email)} className="btn-ghost flex-col !py-2 text-xs">
                    <span className="font-semibold">{d.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-400">
            {isRegister ? (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-indigo-300 hover:text-indigo-200">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{' '}
                <Link to="/register" className="font-semibold text-indigo-300 hover:text-indigo-200">
                  Create a workspace
                </Link>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
    </div>
  );
}

function Logo() {
  return (
    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-glow">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    </div>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}

function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute right-10 top-24 h-40 w-40 animate-float rounded-full bg-indigo-500/20 blur-2xl" />
      <div className="absolute bottom-24 left-20 h-52 w-52 animate-float rounded-full bg-fuchsia-500/20 blur-2xl" style={{ animationDelay: '-3s' }} />
    </div>
  );
}

'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { showToast, ToastElement } = useToast();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email) e.email = 'This field is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email required';
    else if (email.length > 255) e.email = 'Email too long';
    if (!password) e.password = 'This field is required';
    else if (password.length < 8) e.password = 'Min 8 characters';
    if (mode === 'signup' && !username) e.username = 'This field is required';
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = mode === 'login' ? { email, password } : { email, password, username };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Something went wrong', 'error');
        return;
      }

      router.push('/');
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="login-page" className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      {ToastElement}
      <div data-testid="auth-card" className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">P</div>
          <h1 data-testid="auth-title" className="text-2xl font-bold text-slate-800">Patch</h1>
        </div>
        <h2 data-testid="auth-mode-title" className="text-xl font-semibold text-slate-700 mb-6 text-center">
          {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
        </h2>

        <form data-testid="auth-form" onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label data-testid="username-label" htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input
                data-testid="username-input"
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
              />
              {errors.username && <p data-testid="username-error" className="text-red-600 text-sm mt-1">{errors.username}</p>}
            </div>
          )}

          <div>
            <label data-testid="email-label" htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              data-testid="email-input"
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              maxLength={255}
            />
            {errors.email && <p data-testid="email-error" className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label data-testid="password-label" htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              data-testid="password-input"
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            {errors.password && <p data-testid="password-error" className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          <button
            data-testid="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          {mode === 'login' ? (
            <p className="text-slate-600">
              Don&apos;t have an account?{' '}
              <button data-testid="switch-to-signup" onClick={() => { setMode('signup'); setErrors({}); }} className="text-blue-600 hover:underline font-medium">
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-slate-600">
              Already have an account?{' '}
              <button data-testid="switch-to-login" onClick={() => { setMode('login'); setErrors({}); }} className="text-blue-600 hover:underline font-medium">
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

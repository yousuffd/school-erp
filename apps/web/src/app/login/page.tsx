'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [platformMode, setPlatformMode] = useState(false);
  const [subdomain, setSubdomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(
        platformMode ? undefined : subdomain.trim().toLowerCase(),
        email.trim(),
        password,
      );
      auth.saveSession(res.access_token, res.refresh_token, res.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-card p-8 shadow-card">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-button bg-accent-light">
            <GraduationCap size={20} className="text-accent" />
          </div>
          <span className="text-card-title font-bold text-text-primary">SchoolERP</span>
        </div>

        <h1 className="mb-1 text-page-title font-bold text-text-primary">
          {platformMode ? 'Platform Admin Sign in' : 'Sign in'}
        </h1>
        <p className="mb-6 text-body text-text-secondary">
          {platformMode
            ? 'Sign in with your platform-level Super Admin credentials.'
            : "Enter your school's subdomain and your credentials."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!platformMode && (
            <div>
              <label className="mb-1 block text-body text-text-secondary">School Subdomain</label>
              <input
                required
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="e.g. demo"
                className="w-full rounded-button border border-border px-3 py-2 font-mono text-body text-text-primary"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-body text-text-secondary">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-body text-text-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-body text-text-secondary">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-button border border-border px-3 py-2 text-body text-text-primary"
            />
          </div>

          {error && (
            <p className="rounded-button bg-danger/10 px-3 py-2 text-body text-danger">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-caption text-text-secondary">
          SSO sign-in is not available yet — this uses local credentials only (Phase 0).
        </p>

        <button
          type="button"
          onClick={() => {
            setPlatformMode((v) => !v);
            setError(null);
          }}
          className="mt-3 w-full text-caption text-text-secondary underline underline-offset-2 hover:text-text-primary"
        >
          {platformMode ? '← Back to school sign in' : 'Platform Admin sign in →'}
        </button>
      </div>
    </div>
  );
}

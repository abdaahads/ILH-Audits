'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, LogIn, UserPlus, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

/**
 * AUTHENTICATION PAGE — src/app/login/page.tsx
 * ============================================================
 *
 * WHAT THIS FILE DOES:
 * This is the public-facing gateway to the ILH Audits platform. It handles
 * both Sign In (for existing staff) and Sign Up (for new auditors). It
 * communicates directly with the Supabase Auth API to verify credentials.
 *
 * WHY IT MATTERS FOR ILH:
 * Security is paramount. This page ensures that only authorized ILH
 * personnel can access property compliance data.
 * 
 * DESIGN CONTEXT:
 * Neumorphism (Soft UI) — The entire page uses a unified #E0E5EC canvas
 * with dual-drop-shadow depth illusion. The auth card is raised from the
 * canvas, inputs are pressed in, and the submit button responds to touch
 * with a physical pressed-in shadow transition.
 *
 * FOR DEVELOPERS:
 * - This is a Client Component because it handles form state and
 *   password visibility toggling.
 * - The `supabase.auth.signInWithPassword()` call automatically sets
 *   the secure HttpOnly cookies via the `@supabase/ssr` library, which
 *   the `middleware.ts` will then verify on subsequent requests.
 * - On successful login, `window.location.href = '/dashboard'` is used
 *   instead of `router.push()` to force a full hard reload, ensuring
 *   all Supabase auth listeners in the root layout initialize cleanly.
 * ============================================================
 */

/** Allowed authentication modes */
type AuthMode = 'signin' | 'signup';

export default function LoginPage() {
  /* ------------------------------------------------------------------ */
  /*  State                                                              */
  /* ------------------------------------------------------------------ */
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSignUp = mode === 'signup';

  /* ------------------------------------------------------------------ */
  /*  Handlers                                                           */
  /* ------------------------------------------------------------------ */

  /** Toggle between sign-in and sign-up, resetting any error */
  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setError(null);
  };

  /** Submit the auth form to Supabase */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    try {
      if (isSignUp) {
        /* ---- Sign Up ---- */
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }
      } else {
        /* ---- Sign In ---- */
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }
      }

      /* Redirect on success */
      window.location.href = '/dashboard';
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#E0E5EC] px-4 py-12"
      style={{ fontFamily: "'PT Sans', sans-serif" }}
    >
      {/* ============================================================= */}
      {/*  Subtle neumorphic background texture                          */}
      {/* ============================================================= */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#E0E5EC]">
        <div
          className="absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(0,51,102,0.06) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute right-1/4 bottom-1/4 h-[250px] w-[250px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(51,153,102,0.05) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ============================================================= */}
      {/*  Neumorphic auth card                                          */}
      {/* ============================================================= */}
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-[#E0E5EC] p-8 shadow-neo-raised sm:p-10">
          {/* ------ Logo & Tagline ------ */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <img
              src="https://ivyleaguehouse.com/wp-content/uploads/2024/05/ILH-Logo.png"
              alt="ILH — Ivy League House logo"
              className="h-16 w-auto object-contain drop-shadow-md"
            />
            <p className="text-sm tracking-wide text-slate-400">
              Property Audit Management System
            </p>
          </div>

          {/* ------ Mode Toggle (Neumorphic segmented control) ------ */}
          <div className="mb-6 rounded-xl bg-[#E0E5EC] p-1.5 shadow-neo-pressed">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  !isSignUp
                    ? 'bg-[#E0E5EC] text-ilh-navy-700 shadow-neo-raised-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LogIn size={16} />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isSignUp
                    ? 'bg-[#E0E5EC] text-ilh-navy-700 shadow-neo-raised-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <UserPlus size={16} />
                Sign Up
              </button>
            </div>
          </div>

          {/* ------ Error Alert ------ */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-[#E0E5EC] px-4 py-3 text-sm text-red-600 shadow-neo-pressed">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* ------ Form ------ */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Full Name — only in signup mode */}
            {isSignUp && (
              <div className="group relative">
                <label
                  htmlFor="fullName"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl bg-[#E0E5EC] py-3 pl-11 pr-4 text-sm text-slate-700 shadow-neo-pressed transition-all duration-200 placeholder:text-slate-400 focus:text-ilh-navy-700 focus:shadow-[inset_6px_6px_10px_0_rgba(0,51,102,0.12),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="group relative">
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl bg-[#E0E5EC] py-3 pl-11 pr-4 text-sm text-slate-700 shadow-neo-pressed transition-all duration-200 placeholder:text-slate-400 focus:text-ilh-navy-700 focus:shadow-[inset_6px_6px_10px_0_rgba(0,51,102,0.12),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="group relative">
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-[#E0E5EC] py-3 pl-11 pr-12 text-sm text-slate-700 shadow-neo-pressed transition-all duration-200 placeholder:text-slate-400 focus:text-ilh-navy-700 focus:shadow-[inset_6px_6px_10px_0_rgba(0,51,102,0.12),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button — Neumorphic with brand accent */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-ilh-green-500 px-6 py-3 text-sm font-semibold text-white shadow-neo-raised transition-all duration-200 hover:shadow-neo-pressed active:shadow-neo-pressed focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isSignUp ? (
                <UserPlus size={18} />
              ) : (
                <LogIn size={18} />
              )}
              {loading
                ? 'Please wait…'
                : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
            </button>
          </form>

          {/* ------ Footer Toggle ------ */}
          <p className="mt-6 text-center text-sm text-slate-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-ilh-green-600 transition-colors hover:text-ilh-green-700 hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        {/* ------ Bottom Attribution ------ */}
        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Ivy League House. All rights reserved.
        </p>
      </div>
    </div>
  );
}

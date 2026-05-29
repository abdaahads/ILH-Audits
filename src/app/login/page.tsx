'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, LogIn, UserPlus, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

/**
 * LoginPage — Full-screen authentication page for the ILH Audits app.
 *
 * Features:
 *  • Animated gradient background using ILH brand navy (#003366)
 *  • Glassmorphic centered card with backdrop-blur
 *  • Toggle between Sign In and Sign Up modes
 *  • Supabase email/password authentication
 *  • Responsive, mobile-first layout
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
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{ fontFamily: "'PT Sans', sans-serif" }}
    >
      {/* ============================================================= */}
      {/*  Animated gradient background                                  */}
      {/* ============================================================= */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Base gradient — navy to near-black */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#003366] via-[#002244] to-[#001122]" />

        {/* Animated orbs for subtle mesh effect */}
        <div
          className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#003366]/40 blur-[120px]"
          style={{
            animation: 'drift 12s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#339966]/20 blur-[140px]"
          style={{
            animation: 'drift 14s ease-in-out infinite alternate-reverse',
          }}
        />
        <div
          className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-[#004488]/25 blur-[100px]"
          style={{
            animation: 'drift 10s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Keyframe injection — only rendered once via a hidden <style> tag */}
      <style>{`
        @keyframes drift {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, 30px) scale(1.08); }
        }
      `}</style>

      {/* ============================================================= */}
      {/*  Glassmorphic card                                             */}
      {/* ============================================================= */}
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          {/* ------ Logo & Tagline ------ */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <img
              src="https://ivyleaguehouse.com/wp-content/uploads/2024/05/ILH-Logo.png"
              alt="ILH — Ivy League House logo"
              className="h-16 w-auto object-contain drop-shadow-lg"
            />
            <p className="text-sm tracking-wide text-white/60">
              Property Audit Management System
            </p>
          </div>

          {/* ------ Mode Toggle ------ */}
          <div className="mb-6 flex rounded-lg border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all ${
                !isSignUp
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              <LogIn size={16} />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all ${
                isSignUp
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              <UserPlus size={16} />
              Sign Up
            </button>
          </div>

          {/* ------ Error Alert ------ */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 backdrop-blur">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
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
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-lg border border-white/15 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 backdrop-blur transition-colors focus:border-[#339966]/60 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#339966]/25"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="group relative">
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/15 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 backdrop-blur transition-colors focus:border-[#339966]/60 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#339966]/25"
                />
              </div>
            </div>

            {/* Password */}
            <div className="group relative">
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/15 bg-white/5 py-3 pl-11 pr-12 text-sm text-white placeholder:text-white/30 backdrop-blur transition-colors focus:border-[#339966]/60 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#339966]/25"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#339966] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#339966]/20 transition-all hover:bg-[#2d8559] hover:shadow-xl hover:shadow-[#339966]/30 focus:outline-none focus:ring-2 focus:ring-[#339966]/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60"
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
          <p className="mt-6 text-center text-sm text-white/40">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-[#339966] transition-colors hover:text-[#3db876] hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        {/* ------ Bottom Attribution ------ */}
        <p className="mt-6 text-center text-xs text-white/25">
          © {new Date().getFullYear()} Ivy League House. All rights reserved.
        </p>
      </div>
    </div>
  );
}

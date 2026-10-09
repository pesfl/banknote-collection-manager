'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Layers, ShieldCheck, Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler';

function getFriendlyAuthError(errorCode?: string | null): string {
  if (!errorCode) return '';
  switch (errorCode) {
    case 'OAuthSignin':
      return 'Could not construct Google OAuth sign-in URL. Check your Google Client ID & Secret in .env.local.';
    case 'OAuthCallback':
      return 'Google callback failed. Verify that "http://localhost:3000/api/auth/callback/google" is added to Authorized Redirect URIs in Google Cloud Console.';
    case 'OAuthCreateAccount':
      return 'Could not create account from Google profile.';
    case 'AccessDenied':
      return 'Access denied. If your Google Cloud app is in "Testing" mode, ensure your Google email is added to the "Test Users" list.';
    case 'Configuration':
      return 'Server authentication configuration error. Restart your dev server to load updated .env.local variables.';
    case 'Callback':
      return 'Authentication callback error. Please try again.';
    default:
      return `Authentication issue (${errorCode}). Please check your Google Console settings.`;
  }
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const urlError = searchParams.get('error');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(getFriendlyAuthError(urlError));

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMessage('Invalid email or password');
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: 'COLLECTOR' | 'ADMIN') => {
    setIsLoading(true);
    try {
      const email = role === 'ADMIN' ? 'admin@banknote.dev' : 'collector@banknote.dev';
      await signIn('credentials', {
        redirect: false,
        email,
        password: 'demo-password',
        callbackUrl,
      });
      router.push(callbackUrl);
    } catch (err) {
      setErrorMessage('Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setErrorMessage('');
    // Direct top-level NextAuth Google sign-in
    signIn('google', { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20 p-4 transition-colors">
      <div className="absolute top-4 right-4">
        <AnimatedThemeToggler />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-[#0a1931] dark:bg-[#00246b] flex items-center justify-center text-white shadow-lg shadow-blue-950/20 mb-3 border border-blue-900/40">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Collections Vault
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Specimen-Level Collection & 5+1 AI Multi-Source Valuation
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* ========================================================================= */}
        {/* GOOGLE OAUTH SIGN IN BUTTON                                               */}
        {/* ========================================================================= */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 text-xs font-bold shadow-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 mb-5"
        >
          {/* Official Google G Logo SVG */}
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 text-[10px] tracking-wider font-semibold">
              Or Use Sandbox / Credentials
            </span>
          </div>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-800/60">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-blue-900 dark:text-blue-300">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Instant Sandbox Access</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('COLLECTOR')}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#003399] hover:bg-blue-800 text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50"
            >
              🚀 Demo Collector
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('ADMIN')}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
            >
              🛡️ Demo Admin
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collector@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <span>Don't have an account? </span>
          <Link href="/auth/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Register Specimen Vault
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-500">Loading Sign In...</div>}>
      <SignInContent />
    </Suspense>
  );
}


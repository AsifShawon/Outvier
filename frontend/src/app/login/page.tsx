'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GraduationCap, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth.api';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const returnTo = searchParams.get('returnTo');
  const reason = searchParams.get('reason');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (reason === 'session_expired') {
      toast.warning('Your session has expired. Please sign in again.');
    }

    authApi.getMe()
      .then((res) => {
        const user = res.data.data;
        if (user) {
          const target = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
            ? returnTo
            : (user.role === 'admin' ? '/admin' : '/dashboard');
          router.replace(target);
        } else {
          setIsCheckingAuth(false);
        }
      })
      .catch(() => {
        setIsCheckingAuth(false);
      });
  }, [router, returnTo, reason]);

  const mutation = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: (res) => {
      const user = res.data.data.user;
      toast.success(`Welcome back, ${user.name || 'User'}!`);
      qc.invalidateQueries({ queryKey: ['auth-me'] });
      qc.invalidateQueries({ queryKey: ['auth-me-topbar'] });

      const target = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
        ? returnTo
        : (user.role === 'admin' ? '/admin' : '/dashboard');
      router.push(target);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Invalid email or password');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }
    mutation.mutate();
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <div className="w-full max-w-md space-y-8 p-8 rounded-2xl bg-surface border border-border shadow-xl">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary mb-2 shadow-inner">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
            Sign in to Outvier
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Access your university comparisons, application tracker, and profile.
          </p>
        </div>

        {reason === 'session_expired' && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Your previous session has expired. Please log in to continue.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
                className="pl-10 h-11 bg-surface-elevated border-border text-foreground rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                Password
              </Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="pl-10 pr-10 h-11 bg-surface-elevated border-border text-foreground rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl text-sm font-semibold shadow-md shadow-primary/20"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

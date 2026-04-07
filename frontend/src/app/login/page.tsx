'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GraduationCap, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth.api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authApi.login({ username, password }),
    onSuccess: (res) => {
      const { token } = res.data.data;
      localStorage.setItem('outvier_token', token);
      toast.success('Welcome to Outvier Admin!');
      router.push('/admin');
    },
    onError: () => {
      toast.error('Invalid username or password');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter your credentials');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white mx-auto mb-4 border border-white/20">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold font-display text-white">Outvier Admin</h1>
          <p className="text-white/60 text-sm mt-1">Sign in to manage content</p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-white/80 text-xs">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/40"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/80 text-xs">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-9 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/40"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-white text-slate-900 hover:bg-white/90 font-semibold"
            >
              {mutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50 text-center">
              Default credentials: <span className="text-white/70 font-medium">admin / admin</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

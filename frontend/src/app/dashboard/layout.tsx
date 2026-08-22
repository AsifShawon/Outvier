'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, STUDENT_NAV_GROUPS, DashboardSkeleton, ErrorState } from '@/components/shell';
import { authApi } from '@/lib/api/auth.api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'inactive' | 'unauthenticated'>('loading');

  useEffect(() => {
    authApi.getMe()
      .then((res) => {
        const user = res.data.data;
        if (user) {
          if (user.status === 'inactive') {
            setAuthStatus('inactive');
          } else {
            setAuthStatus('authorized');
          }
        } else {
          setAuthStatus('unauthenticated');
          router.push('/login?returnTo=/dashboard');
        }
      })
      .catch(() => {
        setAuthStatus('unauthenticated');
        router.push('/login?returnTo=/dashboard');
      });
  }, [router]);

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background p-6 lg:p-10">
        <DashboardSkeleton metricsCount={3} showChart={true} tableRows={4} />
      </div>
    );
  }

  if (authStatus === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <ErrorState
          title="Account Inactive"
          description="Your Outvier account is currently deactivated or suspended. Please reach out to support for assistance."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (authStatus !== 'authorized') {
    return null;
  }

  return (
    <AppShell
      navGroups={STUDENT_NAV_GROUPS}
      userRole="student"
      brandTitle="Outvier Student"
      brandSubtitle="Discovery & Tracker"
    >
      {children}
    </AppShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, ADMIN_NAV_GROUPS, DashboardSkeleton, PermissionState } from '@/components/shell';
import { authApi } from '@/lib/api/auth.api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'forbidden' | 'unauthenticated'>('loading');

  useEffect(() => {
    authApi.getMe()
      .then((res) => {
        const user = res.data.data;
        if (user && user.role === 'admin') {
          setAuthStatus('authorized');
        } else if (user) {
          setAuthStatus('forbidden');
        } else {
          setAuthStatus('unauthenticated');
          router.push('/login?returnTo=/admin');
        }
      })
      .catch(() => {
        setAuthStatus('unauthenticated');
        router.push('/login?returnTo=/admin');
      });
  }, [router]);

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background p-6 lg:p-10">
        <DashboardSkeleton metricsCount={4} showChart={true} tableRows={5} />
      </div>
    );
  }

  if (authStatus === 'forbidden') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <PermissionState
          title="Admin Access Required"
          description="You do not have administrator permissions to access the Outvier Admin Console."
          returnHref="/dashboard"
          returnLabel="Return to Student Portal"
        />
      </div>
    );
  }

  if (authStatus !== 'authorized') {
    return null;
  }

  return (
    <AppShell
      navGroups={ADMIN_NAV_GROUPS}
      userRole="admin"
      brandTitle="Outvier Admin"
      brandSubtitle="Catalog & Data Ops"
    >
      {children}
    </AppShell>
  );
}

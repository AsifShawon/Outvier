'use client';

import * as React from 'react';
import { ApplicationWorkspaceView } from '@/components/dashboard/workspace/ApplicationWorkspaceView';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ApplicationDetailPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const router = useRouter();

  return (
    <div className="space-y-6 pb-16">
      <ApplicationWorkspaceView
        applicationId={resolvedParams.id}
        onBack={() => router.push('/dashboard/tracker')}
      />
    </div>
  );
}

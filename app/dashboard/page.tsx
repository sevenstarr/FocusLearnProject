'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLoadingScreen } from '@/components/AuthLoadingScreen';
import { useAuth } from '@/components/AuthProvider';
import { FocusLearnShell } from '@/components/FocusLearnShell';

export default function DashboardPage() {
  const router = useRouter();
  const { user, authReady } = useAuth();

  useEffect(() => {
    if (authReady && !user) router.replace('/login');
  }, [authReady, router, user]);

  if (!authReady || !user) return <AuthLoadingScreen />;
  return <FocusLearnShell />;
}

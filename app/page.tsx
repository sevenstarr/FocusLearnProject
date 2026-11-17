'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { AuthLoadingScreen } from '@/components/AuthLoadingScreen';

export default function HomePage() {
  const router = useRouter();
  const { user, authReady } = useAuth();

  useEffect(() => {
    if (!authReady) return;
    router.replace(user ? '/dashboard' : '/login');
  }, [authReady, router, user]);

  return <AuthLoadingScreen />;
}

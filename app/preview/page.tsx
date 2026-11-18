'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLoadingScreen } from '@/components/AuthLoadingScreen';
import { FocusLearnShell } from '@/components/FocusLearnShell';
import { useAuth } from '@/components/AuthProvider';
import { useFocus } from '@/components/FocusProvider';

export default function PreviewPage() {
  const router = useRouter();
  const { user, authReady } = useAuth();
  const { loadingData } = useFocus();

  useEffect(() => {
    if (authReady && user) router.replace('/dashboard');
  }, [authReady, router, user]);

  if (!authReady || loadingData || user) return <AuthLoadingScreen />;

  return (
    <>
      <div className="sticky top-0 z-[100] border-b border-blue-200 bg-blue-50 px-4 py-2 text-center text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
        Modo visitante: seus dados ficam neste navegador.{' '}
        <Link href="/login" className="font-semibold underline underline-offset-2">
          Entrar para sincronizar
        </Link>
      </div>
      <FocusLearnShell />
    </>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { FirebaseProvider } from '@/components/FirebaseProvider';
import { FocusProvider } from '@/components/FocusProvider';

export const metadata: Metadata = {
  title: 'FocusLearn — Plataforma Inteligente de Estudos & Produtividade Acadêmica',
  description:
    'Plataforma inteligente de estudos, produtividade acadêmica, cronômetro Pomodoro com som ambiente, planejador semanal, cadernos em Markdown e comunidade universitária.',
  openGraph: {
    title: 'FocusLearn — Plataforma Inteligente de Estudos & Produtividade Acadêmica',
    description:
      'Organize matérias, acompanhe médias, cronometre ciclos Pomodoro com áudio sintetizado e estude em comunidade.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FocusLearn — Plataforma Inteligente de Estudos',
    description:
      'Organize matérias, acompanhe médias, cronometre ciclos Pomodoro com áudio sintetizado e estude em comunidade.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
        />
      </head>
      <body
        className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased min-h-screen transition-colors duration-200"
        suppressHydrationWarning
      >
        <FirebaseProvider>
          <FocusProvider>{children}</FocusProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}

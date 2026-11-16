import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { FirebaseProvider } from '@/components/FirebaseProvider';
import { FocusProvider } from '@/components/FocusProvider';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-jakarta',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains',
});

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
    <html
      lang="pt-BR"
      className={`${jakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
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

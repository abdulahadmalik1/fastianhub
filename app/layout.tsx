import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TimetableProvider } from '@/context/TimetableContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FastiFlex · Timetable',
  description: 'FAST NUCES Islamabad — Fall 2026 class schedule at a glance. See today\'s classes, current sessions, and free gaps instantly.',
  keywords: ['FAST', 'NUCES', 'timetable', 'schedule', 'Islamabad', 'Fall 2026'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <TimetableProvider>
          {children}
        </TimetableProvider>
      </body>
    </html>
  );
}

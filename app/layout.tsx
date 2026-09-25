import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FastiFlex · Past Papers & Resources',
  description: 'Verified past examination papers, midterm sessionals, finals, quizzes, and course materials across FAST Islamabad, Karachi, Lahore & CFD campuses.',
  keywords: ['FAST', 'NUCES', 'past papers', 'exams', 'Islamabad', 'Karachi', 'Lahore', 'CFD'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}

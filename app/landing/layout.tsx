import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FastiFlex — The Student Platform for FAST-NUCES Islamabad',
  description: 'Past papers, real-time synced timetable, and live room vacancy tracker.',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

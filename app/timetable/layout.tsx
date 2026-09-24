import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Timetable | FastiFlex',
  description: 'Real-time synchronized class timetable for FAST-NUCES Islamabad.',
};

export default function TimetableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

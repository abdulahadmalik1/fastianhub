import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Free Rooms | FastiFlex',
  description: 'Find vacant classrooms and labs in real time at FAST NUCES Islamabad.',
};

export default function FindRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

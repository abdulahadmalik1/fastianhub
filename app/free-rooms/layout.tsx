import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Rooms - FastiFlex',
  description: 'Find vacant classrooms and labs in real time at FAST NUCES Islamabad.',
};

export default function FreeRoomsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

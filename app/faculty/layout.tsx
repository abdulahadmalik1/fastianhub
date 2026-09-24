import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Faculty Search - FastiFlex',
  description: 'Quickly find FAST faculty offices and emails.',
};

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

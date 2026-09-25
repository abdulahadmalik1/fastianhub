import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credits · FastianHub',
  description: 'Credits and attribution for open-source past paper archives across FAST-NUCES campuses.',
};

export default function CreditsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

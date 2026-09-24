import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Past Papers & Outlines | FastiFlex',
  description: 'Download FAST-NUCES Islamabad semester past papers, sessionals, finals, and course outlines directly.',
};

export default function PastPapersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

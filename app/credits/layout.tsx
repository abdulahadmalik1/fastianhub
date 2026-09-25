import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata(
  'Past Paper Archive Contributors & Credits | FastianHub',
  'Meet the student contributors behind FAST NUCES past paper archives for Islamabad, Karachi, Lahore and Chiniot-Faisalabad on FastianHub.',
  '/credits',
);

export default function CreditsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

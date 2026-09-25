import type { ReactNode } from 'react';
export type IconName = 'book' | 'bookmark' | 'search' | 'arrow' | 'close' | 'pin' | 'file' | 'download' | 'external' | 'check' | 'heart';
const paths: Record<IconName, ReactNode> = {
  book: <><path d="M12 6c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z" /><path d="M12 6v15M6 9h3M15 9h3" /></>,
  bookmark: <path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4V4Z" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
  file: <><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Z" /><path d="M14 3v5h5M9 12h6M9 16h6" /></>,
  download: <path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" />,
  external: <path d="M14 3h7v7m0-7L10 14M10 4H4v16h16v-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  heart: <path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-5 5 3 11 8 15 5-4 13-10 8-15Z" />,
};
export default function Icon({ name, size = 20, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

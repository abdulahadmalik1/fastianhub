'use client';
import { useEffect, useRef, type ReactNode } from 'react';
export default function Modal({ children, labelledBy, onClose, className = '', dismissible = true }: { children: ReactNode; labelledBy: string; onClose: () => void; className?: string; dismissible?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className={`dialog ${className}`} aria-labelledby={labelledBy}
    onCancel={(event) => { event.preventDefault(); if (dismissible) onClose(); }}
    onClick={(event) => {
      if (event.target !== event.currentTarget || !dismissible) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>{children}</dialog>;
}

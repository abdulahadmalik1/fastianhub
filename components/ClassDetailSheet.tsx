'use client';
import { ClassEntry } from '@/lib/timetableData';
import { useEffect } from 'react';

interface Props { entry: ClassEntry; onClose: () => void; }

const TYPE_COLORS: Record<string,string> = {
  lecture: 'var(--indigo-light)',
  lab:     'var(--teal-light)',
  tutorial:'var(--amber)',
};

export default function ClassDetailSheet({ entry, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="sheet-overlay" id="class-detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-label="Class details">
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <p className="sheet-course">{entry.course}</p>
            <p className="sheet-section">{entry.section} · {entry.program}</p>
          </div>
          <span className={`sheet-type-badge ${entry.type}`}>{entry.type}</span>
        </div>

        <div className="sheet-body">
          <div className="sheet-row">
            <span className="sheet-row-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </span>
            <div className="sheet-row-content">
              <p className="sheet-row-label">Time</p>
              <p className="sheet-row-value">{entry.startLabel} – {entry.endLabel}</p>
            </div>
          </div>

          <div className="sheet-row">
            <span className="sheet-row-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </span>
            <div className="sheet-row-content">
              <p className="sheet-row-label">Room</p>
              <p className="sheet-row-value">{entry.room}</p>
            </div>
          </div>

          <div className="sheet-row">
            <span className="sheet-row-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </span>
            <div className="sheet-row-content">
              <p className="sheet-row-label">Day</p>
              <p className="sheet-row-value">{entry.day}</p>
            </div>
          </div>

          <div className="sheet-row">
            <span className="sheet-row-icon" style={{color: TYPE_COLORS[entry.type]}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </span>
            <div className="sheet-row-content">
              <p className="sheet-row-label">Section</p>
              <p className="sheet-row-value">{entry.section}</p>
            </div>
          </div>

          <div className="sheet-row">
            <span className="sheet-row-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </span>
            <div className="sheet-row-content">
              <p className="sheet-row-label">Program</p>
              <p className="sheet-row-value">{entry.program}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useTimetable } from '@/context/TimetableContext';

export default function ViewToggle() {
  const { viewMode, setViewMode } = useTimetable();
  return (
    <div className="view-toggle" role="tablist" aria-label="View mode">
      <button
        id="toggle-today"
        role="tab"
        aria-selected={viewMode === 'today'}
        className={`toggle-btn${viewMode === 'today' ? ' active' : ''}`}
        onClick={() => setViewMode('today')}
      >
        Today
      </button>
      <button
        id="toggle-week"
        role="tab"
        aria-selected={viewMode === 'week'}
        className={`toggle-btn${viewMode === 'week' ? ' active' : ''}`}
        onClick={() => setViewMode('week')}
      >
        Week
      </button>
    </div>
  );
}

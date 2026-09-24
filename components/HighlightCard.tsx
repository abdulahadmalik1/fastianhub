'use client';
import { useTimetable } from '@/context/TimetableContext';
import { ClassEntry } from '@/lib/timetableData';

interface Props { onClassClick: (e: ClassEntry) => void; }

function fmtMins(mins: number): string {
  const h = Math.floor(mins / 60) % 12 || 12;
  const m = mins % 60;
  const ap = Math.floor(mins / 60) >= 12 ? 'PM' : 'AM';
  return `${h}:${String(m).padStart(2,'0')} ${ap}`;
}

function minutesUntil(targetMins: number, nowMins: number): string {
  const diff = targetMins - nowMins;
  if (diff <= 0) return 'Now';
  if (diff < 60) return `${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function progressPct(entry: ClassEntry, nowMins: number): number {
  const total = entry.endMins - entry.startMins;
  const elapsed = nowMins - entry.startMins;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export default function HighlightCard({ onClassClick }: Props) {
  const { currentEntry, nextEntry, nowMins, isToday, filteredEntries, selectedDay } = useTimetable();

  // If not today, show first class of the selected day
  if (!isToday) {
    const first = filteredEntries[0];
    if (!first) return (
      <div className="highlight-section">
        <div className="highlight-card free" id="highlight-card-free">
          <span className="hc-badge free">No Classes</span>
          <p className="hc-course" style={{ fontSize: 16 }}>Nothing scheduled</p>
          <p className="hc-section">Enjoy the free day 🎉</p>
        </div>
      </div>
    );
    return (
      <div className="highlight-section">
        <div className="highlight-card next" id="highlight-card-next" onClick={() => onClassClick(first)}>
          <span className="hc-badge next">
            <span className="hc-pulse next" />
            First Class
          </span>
          <p className="hc-course">{first.course}</p>
          <p className="hc-section">{first.section} · {first.program}</p>
          <div className="hc-meta">
            <span className="hc-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {first.startLabel} – {first.endLabel}
            </span>
            <span className="hc-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {first.room}
            </span>
          </div>
          <p className="hc-status next">Starts on {selectedDay}</p>
        </div>
      </div>
    );
  }

  if (currentEntry) {
    const pct = progressPct(currentEntry, nowMins);
    const remaining = currentEntry.endMins - nowMins;
    return (
      <div className="highlight-section">
        <div className="highlight-card current" id="highlight-card-current" onClick={() => onClassClick(currentEntry)}>
          <span className="hc-badge current">
            <span className="hc-pulse current" />
            In Progress
          </span>
          <p className="hc-course">{currentEntry.course}</p>
          <p className="hc-section">{currentEntry.section} · {currentEntry.program}</p>
          <div className="hc-meta">
            <span className="hc-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {currentEntry.startLabel} – {currentEntry.endLabel}
            </span>
            <span className="hc-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {currentEntry.room}
            </span>
          </div>
          <p className="hc-status current">Ends in {minutesUntil(currentEntry.endMins, nowMins)}</p>
          <div className="hc-progress-wrap">
            <div className="hc-progress-bar" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    );
  }

  if (nextEntry) {
    const startsIn = minutesUntil(nextEntry.startMins, nowMins);
    return (
      <div className="highlight-section">
        <div className="highlight-card next" id="highlight-card-next" onClick={() => onClassClick(nextEntry)}>
          <span className="hc-badge next">
            <span className="hc-pulse next" />
            Next Class
          </span>
          <p className="hc-course">{nextEntry.course}</p>
          <p className="hc-section">{nextEntry.section} · {nextEntry.program}</p>
          <div className="hc-meta">
            <span className="hc-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {nextEntry.startLabel} – {nextEntry.endLabel}
            </span>
            <span className="hc-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {nextEntry.room}
            </span>
          </div>
          <p className="hc-status next">Starts in {startsIn}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="highlight-section">
      <div className="highlight-card free" id="highlight-card-done">
        <span className="hc-badge free">All Done</span>
        <p className="hc-course" style={{ fontSize: 16 }}>No more classes today</p>
        <p className="hc-section">See you tomorrow 👋</p>
      </div>
    </div>
  );
}

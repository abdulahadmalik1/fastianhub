'use client';
import { useTimetable } from '@/context/TimetableContext';
import { ClassEntry } from '@/lib/timetableData';

interface Props { onClassClick: (e: ClassEntry) => void; }

function fmtMins(mins: number): string {
  const h = Math.floor(mins / 60) % 12 || 12;
  const m = mins % 60;
  return `${h}:${String(m).padStart(2,'0')} ${Math.floor(mins/60) >= 12 ? 'PM' : 'AM'}`;
}

// Build timeline rows: entries sorted by start, with free gap rows in between
interface TimelineRow {
  type: 'class' | 'free';
  entry?: ClassEntry;
  freeFrom?: number;
  freeTo?: number;
}

function buildRows(entries: ClassEntry[]): TimelineRow[] {
  const rows: TimelineRow[] = [];
  const sorted = [...entries].sort((a,b) => a.startMins - b.startMins);
  
  let prevEnd = 0;
  for (const e of sorted) {
    const gap = e.startMins - prevEnd;
    if (prevEnd > 0 && gap >= 20) {
      rows.push({ type: 'free', freeFrom: prevEnd, freeTo: e.startMins });
    }
    rows.push({ type: 'class', entry: e });
    if (e.endMins > prevEnd) prevEnd = e.endMins;
  }
  return rows;
}

function classStatus(e: ClassEntry, nowMins: number, isToday: boolean): 'completed' | 'current' | 'upcoming' {
  if (!isToday) return 'upcoming';
  if (nowMins >= e.endMins) return 'completed';
  if (nowMins >= e.startMins) return 'current';
  return 'upcoming';
}

export default function Timeline({ onClassClick }: Props) {
  const { filteredEntries, nowMins, isToday } = useTimetable();

  if (filteredEntries.length === 0) {
    return (
      <div className="empty-day">
        <div className="empty-icon">📭</div>
        <p className="empty-title">No classes found</p>
        <p className="empty-sub">Try a different section or day</p>
      </div>
    );
  }

  const rows = buildRows(filteredEntries);

  // Find if now-line should appear
  const nowRow = isToday ? filteredEntries.find(e => e.startMins > nowMins) : null;

  return (
    <section className="timeline-section" aria-label="Class timeline">
      <div className="timeline-header">
        <span className="timeline-title">Schedule</span>
        <span className="class-count">{filteredEntries.length} classes</span>
      </div>

      <div className="timeline">
        {rows.map((row, i) => {
          if (row.type === 'free') {
            const duration = (row.freeTo! - row.freeFrom!);
            const durLabel = duration < 60
              ? `${duration} min`
              : `${Math.floor(duration/60)}h ${duration%60 > 0 ? duration%60+'m':''}`;
            return (
              <div key={`free-${i}`} className="timeline-row">
                <div className="time-col">
                  <span className="time-label">{fmtMins(row.freeFrom!)}</span>
                </div>
                <div className="class-col">
                  <div className="free-gap">
                    <span className="free-label">🕊 Free · {durLabel}</span>
                    <span className="free-action">Find room →</span>
                  </div>
                </div>
                <div className="time-line" />
              </div>
            );
          }

          const e = row.entry!;
          const status = classStatus(e, nowMins, isToday);
          const isCurrent = status === 'current';

          return (
            <div key={e.id} className="timeline-row">
              <div className="time-col">
                <span className="time-label">{e.startLabel}</span>
              </div>
              <div className="class-col">
                {/* Now-line: appears before the next upcoming class */}
                {isToday && isCurrent && (
                  <div className="now-line" style={{ marginBottom: 6 }}>
                    <div className="now-dot" />
                    <div className="now-dash" />
                    <span className="now-time">{fmtMins(nowMins)}</span>
                  </div>
                )}
                <div
                  id={`class-card-${e.id}`}
                  className={`class-card ${status} ${e.type}`}
                  onClick={() => onClassClick(e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={ev => ev.key === 'Enter' && onClassClick(e)}
                  aria-label={`${e.course} at ${e.startLabel}`}
                >
                  <div className="card-top">
                    <span className="card-course">{e.course}</span>
                    <span className={`card-badge ${isCurrent ? 'current' : e.type}`}>
                      {isCurrent ? 'NOW' : e.type}
                    </span>
                  </div>
                  <div className="card-section">{e.section}</div>
                  <div className="card-bottom">
                    <span className="card-info">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      {e.startLabel} – {e.endLabel}
                    </span>
                    <span className="card-info">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {e.room}
                    </span>
                  </div>
                  {isCurrent && (
                    <div className="card-now">
                      <span style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',display:'inline-block',boxShadow:'0 0 6px var(--green)'}} />
                      In progress
                    </div>
                  )}
                </div>
              </div>
              <div className="time-line" />
            </div>
          );
        })}
      </div>
    </section>
  );
}

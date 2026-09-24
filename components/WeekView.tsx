'use client';
import { DAYS, Day, ClassEntry } from '@/lib/timetableData';
import { useTimetable } from '@/context/TimetableContext';

interface Props { onClassClick: (e: ClassEntry) => void; }

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function getTodayName(): Day {
  const n = DAY_NAMES[new Date().getDay()];
  return (DAYS as readonly string[]).includes(n) ? n as Day : 'Monday';
}

const SHORT: Record<string,string> = {
  Monday:'Mon',Tuesday:'Tue',Wednesday:'Wed',
  Thursday:'Thu',Friday:'Fri',Saturday:'Sat',
};

// Representative slots for week view
const DISPLAY_SLOTS = [
  '08:30-09:50','10:00-11:20','11:30-12:50',
  '13:00-14:20','14:30-15:50','15:55-17:15',
  '17:20-18:40','18:45-20:05',
];

export default function WeekView({ onClassClick }: Props) {
  const { schedule, sectionFilter } = useTimetable();
  const today = getTodayName();

  // Build a map: day → slot → matching entry from live schedule
  const grid: Record<string, Record<string, ClassEntry | null>> = {};
  for (const day of DAYS) {
    grid[day] = {};
    const dayClasses = schedule.filter(e => e.day === day);
    for (const slot of DISPLAY_SLOTS) {
      grid[day][slot] = dayClasses.find(e => e.slot === slot) ?? null;
    }
  }

  const displaySection = (() => {
    if (!sectionFilter) return 'All';
    if (sectionFilter.startsWith('202') && sectionFilter.includes('-')) {
      const [batch, ...rest] = sectionFilter.split('-');
      return `${rest.join('-')} (${batch})`;
    }
    return sectionFilter;
  })();

  return (
    <section className="week-grid-section" aria-label="Week overview grid">
      <div className="week-grid">
        {DAYS.map(day => (
          <div key={day} className="week-day-col">
            <div className={`week-day-header${day === today ? ' today' : ''}`}>
              {SHORT[day]}
            </div>
            {DISPLAY_SLOTS.map(slot => {
              const e = grid[day][slot];
              if (!e) return (
                <div key={slot} className="week-slot empty" title={slot} />
              );
              const shortCourse = e.course.length > 10 ? e.course.slice(0,9)+'…' : e.course;
              return (
                <div
                  key={slot}
                  className={`week-slot ${e.type}`}
                  style={{
                    borderLeft: e.color ? `3px solid ${e.color}` : undefined,
                  }}
                  title={`${e.course} · ${e.section} · ${e.room} · ${e.startLabel}`}
                  onClick={() => onClassClick(e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={ev => ev.key === 'Enter' && onClassClick(e)}
                >
                  {shortCourse}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p style={{fontSize:11,color:'var(--ink-3)',textAlign:'center',marginTop:12}}>
        Tap a slot to see details · Schedule for: {displaySection}
      </p>
    </section>
  );
}

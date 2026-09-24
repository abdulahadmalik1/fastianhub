'use client';
import { useTimetable } from '@/context/TimetableContext';
import { DAYS, Day } from '@/lib/timetableData';

const SHORT: Record<string, string> = {
  Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed',
  Thursday:'Thu', Friday:'Fri', Saturday:'Sat',
};

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function getTodayName(): Day {
  const n = DAY_NAMES[new Date().getDay()];
  return (DAYS as readonly string[]).includes(n) ? n as Day : 'Monday';
}

export default function DaySelector() {
  const { selectedDay, setSelectedDay } = useTimetable();
  const today = getTodayName();

  return (
    <nav className="day-selector" aria-label="Day selector">
      {DAYS.map(day => {
        const isActive = selectedDay === day;
        const isToday  = day === today;
        return (
          <button
            key={day}
            id={`day-btn-${day.toLowerCase()}`}
            className={`day-btn${isActive ? ' active' : ''}${isToday ? ' today-dot' : ''}`}
            onClick={() => setSelectedDay(day)}
            aria-pressed={isActive}
            aria-label={`${day}${isToday ? ' (today)' : ''}`}
          >
            <span className="day-name">{SHORT[day]}</span>
            {isToday && <span className="day-label">Today</span>}
          </button>
        );
      })}
    </nav>
  );
}

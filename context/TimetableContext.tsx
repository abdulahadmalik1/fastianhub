'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DAYS, Day, ClassEntry } from '@/lib/timetableData';

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function getTodayName(): Day {
  const d = new Date();
  const name = DAY_NAMES[d.getDay()];
  return (DAYS as readonly string[]).includes(name) ? (name as Day) : 'Monday';
}

function getNowMins(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

interface TimetableCtx {
  selectedDay: Day;
  setSelectedDay: (d: Day) => void;
  sectionFilter: string;
  setSectionFilter: (s: string) => void;
  viewMode: 'today' | 'week';
  setViewMode: (v: 'today' | 'week') => void;
  dayEntries: ClassEntry[];
  filteredEntries: ClassEntry[];
  schedule: ClassEntry[];
  nowMins: number;
  currentEntry: ClassEntry | null;
  nextEntry: ClassEntry | null;
  isToday: boolean;
  loading: boolean;
  isHydrated: boolean;
  syncStatus: 'syncing' | 'live';
  refreshSync: () => Promise<void>;
}

const Ctx = createContext<TimetableCtx | null>(null);

// In-memory cooldown guard for background Drive check
let lastFetch = 0;

export function TimetableProvider({ children }: { children: ReactNode }) {
  const [selectedDay, setSelectedDay] = useState<Day>(getTodayName);
  const [sectionFilter, setSectionFilter] = useState('2026-CS-A');
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [nowMins, setNowMins] = useState(getNowMins);
  
  const [schedule, setSchedule] = useState<ClassEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'live'>('syncing');

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Minute ticker for current/next class countdown
  useEffect(() => {
    const id = setInterval(() => setNowMins(getNowMins()), 60_000);
    return () => clearInterval(id);
  }, []);

  // 1. Instant fetch directly from Firestore cache (<50ms)
  const fetchSchedule = useCallback(async (targetSection: string) => {
    if (!targetSection) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule?section=${encodeURIComponent(targetSection)}`);
      if (!res.ok) {
        console.warn(`[FastiFlex] Schedule API returned ${res.status}`);
        setSchedule([]);
        return;
      }
      const data = await res.json();
      setSchedule(data.schedule || []);
    } catch (err) {
      console.warn("[FastiFlex] Failed to fetch timetable:", err);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Non-blocking background check for Google Sheet updates
  const checkBackgroundUpdates = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetch < 20000) {
      return;
    }
    lastFetch = now;
    setSyncStatus('syncing');

    const startTime = Date.now();
    try {
      const res = await fetch(`/api/check-update${force ? '?force=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        if (data.updated) {
          console.log('[FastiFlex] Timetable updated in Google Sheets! Refreshing schedule in realtime...');
          await fetchSchedule(sectionFilter);
        }
      }
    } catch {
      // Quiet background check, never blocks or interrupts UI
    } finally {
      // Smooth visibility of the syncing state (min 1100ms)
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 1100 - elapsed);
      setTimeout(() => {
        setSyncStatus('live');
      }, remainingTime);
    }
  }, [fetchSchedule, sectionFilter]);

  // Initial load and section change: instant load + background check
  useEffect(() => {
    fetchSchedule(sectionFilter);
    const timer = setTimeout(() => {
      checkBackgroundUpdates(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchSchedule, checkBackgroundUpdates, sectionFilter]);

  // Automatic background sync every 45 seconds while open
  useEffect(() => {
    const timer = setInterval(() => {
      checkBackgroundUpdates(false);
    }, 45_000);
    return () => clearInterval(timer);
  }, [checkBackgroundUpdates]);

  // When tab becomes visible again: check in background
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        checkBackgroundUpdates(true);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkBackgroundUpdates]);

  const refreshSync = useCallback(async () => {
    await checkBackgroundUpdates(true);
  }, [checkBackgroundUpdates]);

  const todayName = getTodayName();
  const isToday = selectedDay === todayName;

  // Filter schedule to only show entries for the selected day
  const filteredEntries = schedule
    .filter(e => e.day === selectedDay)
    .sort((a, b) => a.startMins - b.startMins);

  const current = isToday
    ? filteredEntries.find(e => e.startMins <= nowMins && nowMins < e.endMins) ?? null
    : null;

  const next = isToday
    ? filteredEntries.find(e => e.startMins > nowMins) ?? null
    : filteredEntries[0] ?? null;

  return (
    <Ctx.Provider value={{
      selectedDay, setSelectedDay,
      sectionFilter, setSectionFilter,
      viewMode, setViewMode,
      dayEntries: filteredEntries,
      filteredEntries,
      schedule,
      nowMins,
      currentEntry: current,
      nextEntry: next,
      isToday,
      loading,
      isHydrated,
      syncStatus,
      refreshSync
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTimetable() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTimetable must be inside TimetableProvider');
  return ctx;
}

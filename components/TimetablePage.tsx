'use client';
import { useState, useEffect } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import TopBar from './TopBar';
import DaySelector from './DaySelector';
import ViewToggle from './ViewToggle';
import HighlightCard from './HighlightCard';
import Timeline from './Timeline';
import WeekView from './WeekView';
import ClassDetailSheet from './ClassDetailSheet';
import SettingsModal from './SettingsModal';
import SectionSetup from './SectionSetup';
import { ClassEntry } from '@/lib/timetableData';

export default function TimetablePage() {
  const { viewMode, loading, isHydrated, setSectionFilter } = useTimetable();
  const [detailEntry, setDetailEntry] = useState<ClassEntry | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [setupDone, setSetupDone] = useState<boolean | null>(null); // null = checking

  // Check localStorage for saved section on mount
  useEffect(() => {
    const saved = localStorage.getItem('fastiflex_section');
    if (saved) {
      setSectionFilter(saved);
      setSetupDone(true);
    } else {
      setSetupDone(false);
    }
  }, []);

  // Still checking localStorage — render nothing to avoid flash
  if (setupDone === null) return null;

  // First time — show setup screen
  if (!setupDone) {
    return (
      <SectionSetup
        onDone={(section) => {
          setSectionFilter(section);
          setSetupDone(true);
        }}
      />
    );
  }

  // Main app
  return (
    <div className="app-shell">
      <TopBar onSettingsClick={() => setShowSettings(true)} />
      <DaySelector />
      <ViewToggle />

      {!isHydrated || loading ? (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="skeleton" style={{ height: 140, borderRadius: 18 }} />
          <div className="skeleton" style={{ height: 72, borderRadius: 14 }} />
          <div className="skeleton" style={{ height: 72, borderRadius: 14 }} />
          <div className="skeleton" style={{ height: 72, borderRadius: 14 }} />
        </div>
      ) : (
        <>
          <HighlightCard onClassClick={setDetailEntry} />
          <div className="divider" />
          {viewMode === 'today'
            ? <Timeline onClassClick={setDetailEntry} />
            : <WeekView onClassClick={setDetailEntry} />
          }
        </>
      )}

      {detailEntry && (
        <ClassDetailSheet entry={detailEntry} onClose={() => setDetailEntry(null)} />
      )}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSectionChange={(sec) => {
            localStorage.setItem('fastiflex_section', sec);
            setSectionFilter(sec);
          }}
        />
      )}
    </div>
  );
}

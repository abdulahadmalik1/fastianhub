'use client';
import Link from 'next/link';
import { useTimetable } from '@/context/TimetableContext';

interface Props { onSettingsClick: () => void; }

export default function TopBar({ onSettingsClick }: Props) {
  const { sectionFilter, syncStatus, refreshSync } = useTimetable();

  const displaySection = (() => {
    if (!sectionFilter) return 'All sections';
    if (sectionFilter.startsWith('202') && sectionFilter.includes('-')) {
      const [batch, ...rest] = sectionFilter.split('-');
      return `${rest.join('-')} · Batch ${batch}`;
    }
    return sectionFilter;
  })();

  const isSyncing = syncStatus === 'syncing';

  return (
    <header className="topbar">
      {/* Subtle top hairline loader when syncing */}
      {isSyncing && <div className="topbar-sync-line" aria-hidden="true" />}

      <div className="topbar-left">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1 className="topbar-title">FastiFlex</h1>
        </Link>
        <p className="topbar-sub">
          Fall 2026 · <span>{displaySection}</span>
        </p>
      </div>
      <div className="topbar-actions">
        <button
          className={`sync-badge ${syncStatus}`}
          onClick={() => refreshSync()}
          disabled={isSyncing}
          title={isSyncing ? 'Checking Google Sheets for updates...' : 'Synced with FAST timetable in real time · Click to refresh'}
          aria-label={isSyncing ? 'Syncing timetable' : 'Timetable is live'}
          id="sync-status-badge"
        >
          {isSyncing ? (
            <svg className="sync-spinner" viewBox="0 0 24 24" fill="none">
              <circle className="sync-spinner-track" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" />
              <path className="sync-spinner-head" d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <span className="sync-dot" />
          )}
          <span className="sync-label">{isSyncing ? 'Syncing' : 'Live'}</span>
        </button>

        <Link
          href="/findroom"
          className="topbar-find-room-btn"
          id="find-free-rooms-nav-btn"
          title="Find Free Rooms"
        >
          Find Free Rooms
        </Link>

        <button className="icon-btn" onClick={onSettingsClick} aria-label="Settings" id="settings-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </header>
  );
}

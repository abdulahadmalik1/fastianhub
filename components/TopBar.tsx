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
        <h1 className="topbar-title">FastiFlex</h1>
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

        <Link href="/free-rooms" className="icon-btn" aria-label="Find Free Rooms" title="Find Free Rooms" id="free-rooms-nav-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M6 21V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17" />
            <circle cx="13.5" cy="12" r="1" fill="currentColor" />
          </svg>
        </Link>

        <Link href="/past-papers" className="icon-btn" aria-label="Past Papers & Outlines" title="Past Papers & Outlines" id="past-papers-nav-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </Link>

        <Link href="/faculty" className="icon-btn" aria-label="Faculty Search" title="Faculty Search" id="faculty-search-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
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

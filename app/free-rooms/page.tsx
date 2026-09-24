'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DAYS, Day, TIME_SLOTS } from '@/lib/timetableData';

const BUILDINGS = ['All', 'Building C', 'Building D', 'Labs'] as const;
type Building = typeof BUILDINGS[number];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function getTodayName(): Day {
  const n = DAY_NAMES[new Date().getDay()];
  return (DAYS as readonly string[]).includes(n) ? (n as Day) : 'Monday';
}

function getCurrentTimeSlot(): string {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  for (const s of TIME_SLOTS) {
    const [start, end] = s.split('-').map(t => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    });
    if (currentMins >= start && currentMins <= end) {
      return s;
    }
  }
  return 'all';
}

interface OccupiedSlot {
  slot: string;
  startLabel: string;
  endLabel: string;
  course: string;
  section: string;
  type: string;
}

interface RoomData {
  room: string;
  building: string;
  type: string;
  isFree: boolean;
  occupyingClass: OccupiedSlot | null;
  occupiedSlots: OccupiedSlot[];
  freeSlots: string[];
  totalFreeSlots: number;
  totalOccupiedSlots: number;
}

export default function FreeRoomsPage() {
  const [selectedDay, setSelectedDay] = useState<Day>(getTodayName());
  const [selectedSlot, setSelectedSlot] = useState<string>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<Building>('All');
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [copiedRoom, setCopiedRoom] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'live'>('live');

  const today = getTodayName();

  const fetchRooms = useCallback(async (day: Day, slot: string, force: boolean = false) => {
    setLoading(true);
    setSyncStatus('syncing');
    try {
      const params = new URLSearchParams({
        day,
        slot,
        ...(force ? { force: 'true' } : {}),
      });

      const res = await fetch(`/api/free-rooms?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch rooms');
      const data = await res.json();
      setRooms(data.rooms || []);
      setHasSearched(true);
      setSyncStatus('live');
    } catch (err) {
      console.warn('[Free Rooms] Fetch error:', err);
      setSyncStatus('idle');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchRooms(selectedDay, selectedSlot);
  }, []);

  const handleSearch = () => {
    fetchRooms(selectedDay, selectedSlot);
  };

  const setNowSlot = () => {
    const slot = getCurrentTimeSlot();
    setSelectedDay(today);
    setSelectedSlot(slot);
    fetchRooms(today, slot);
  };

  const copyRoomName = (roomName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(roomName);
    setCopiedRoom(roomName);
    setTimeout(() => setCopiedRoom(null), 1800);
  };

  // Filtered by building
  const filteredRooms = useMemo(() => {
    let result = rooms;
    if (selectedBuilding !== 'All') {
      result = result.filter(r => r.building === selectedBuilding);
    }
    // Sort: Free rooms first, then by name
    return [...result].sort((a, b) => {
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;
      return a.room.localeCompare(b.room);
    });
  }, [rooms, selectedBuilding]);

  const freeCount = useMemo(() => {
    return filteredRooms.filter(r => r.isFree).length;
  }, [filteredRooms]);

  return (
    <div className="app-shell" style={{ paddingBottom: 60 }}>
      {/* Top Header */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" className="icon-btn" aria-label="Back to Timetable" title="Back to Timetable" id="back-home-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div className="topbar-left">
            <h1 className="topbar-title">Find Free Rooms</h1>
            <p className="topbar-sub">
              FAST Islamabad · <span>{hasSearched ? `${freeCount} available` : 'Live Room Vacancy'}</span>
            </p>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className={`sync-badge ${syncStatus === 'syncing' ? 'syncing' : 'live'}`}
            onClick={() => fetchRooms(selectedDay, selectedSlot, true)}
            title="Click to check Google Sheets for latest updates"
            aria-label="Sync status"
          >
            {syncStatus === 'syncing' ? (
              <svg className="sync-spinner" viewBox="0 0 24 24" fill="none">
                <circle className="sync-spinner-track" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" />
                <path className="sync-spinner-head" d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            ) : (
              <span className="sync-dot" />
            )}
            <span className="sync-label">{syncStatus === 'syncing' ? 'Syncing' : 'Live'}</span>
          </button>
        </div>
      </header>

      {/* 1. Day Selector */}
      <div style={{ padding: '0 20px', marginTop: 14 }}>
        <p className="field-label">1. Select Day</p>
      </div>
      <nav className="day-selector" aria-label="Day selector" style={{ marginTop: 2 }}>
        {DAYS.map((day) => {
          const isActive = selectedDay === day;
          const isToday = day === today;
          return (
            <button
              key={day}
              id={`room-day-${day.toLowerCase()}`}
              className={`day-btn${isActive ? ' active' : ''}${isToday ? ' today-dot' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              <span className="day-name">{day.slice(0, 3)}</span>
              {isToday && <span className="day-label">Today</span>}
            </button>
          );
        })}
      </nav>

      {/* 2. Time Slot Option */}
      <div style={{ padding: '0 20px', marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <p className="field-label" style={{ margin: 0 }}>2. Select Time Slot (Optional)</p>
          <button
            className="room-now-btn"
            onClick={setNowSlot}
            title="Auto-select current active slot right now"
          >
            ⚡ Right Now
          </button>
        </div>

        <div className="room-slot-selector">
          <button
            className={`room-slot-chip ${selectedSlot === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedSlot('all')}
          >
            All Day
          </button>
          {TIME_SLOTS.map((s) => {
            const isActive = selectedSlot === s;
            return (
              <button
                key={s}
                className={`room-slot-chip ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedSlot(s)}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Building Filter */}
      <div style={{ padding: '0 20px', marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn-primary"
            onClick={handleSearch}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px',
              fontSize: 14,
            }}
            id="search-free-rooms-btn"
          >
            {loading ? (
              <>
                <div className="sync-spinner" style={{ width: 16, height: 16 }} />
                <span>Checking Live Schedule...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span>Find Free Rooms</span>
              </>
            )}
          </button>
        </div>

        {/* Building Filter Tabs */}
        <div className="fac-dept-nav" style={{ padding: 0, marginTop: 14 }}>
          {BUILDINGS.map((b) => (
            <button
              key={b}
              className={`fac-dept-btn ${selectedBuilding === b ? 'active' : ''}`}
              onClick={() => setSelectedBuilding(b)}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div style={{ padding: '0 20px', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', margin: 0 }}>
          {selectedSlot === 'all'
            ? `${selectedDay} · Room Schedule`
            : `${selectedDay} · ${selectedSlot}`}
        </p>
        <span className="room-count-badge">
          {freeCount} Free / {filteredRooms.length} Rooms
        </span>
      </div>

      {/* Room Cards Grid */}
      <main style={{ padding: '0 20px', marginTop: 10 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="skeleton" style={{ height: 90, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 90, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 90, borderRadius: 16 }} />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="fac-empty-state">
            <div className="fac-empty-icon">🏢</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 4px', color: 'var(--ink-1)' }}>
              No rooms found
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
              Try selecting another building or clicking "All Day"
            </p>
          </div>
        ) : (
          <div className="room-grid">
            {filteredRooms.map((r) => {
              const isFree = r.isFree;
              return (
                <article
                  key={r.room}
                  className={`room-card ${isFree ? 'is-free' : 'is-occupied'}`}
                  onClick={() => setSelectedRoom(r)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${r.room}, ${isFree ? 'Free' : 'Occupied'}`}
                >
                  <div className="room-card-top">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h2 className="room-title">{r.room}</h2>
                        <span className="room-type-tag">{r.type}</span>
                      </div>
                      <p className="room-building-text">{r.building}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`room-status-badge ${isFree ? 'free' : 'busy'}`}>
                        <span className="room-status-dot" />
                        {isFree ? 'FREE' : 'OCCUPIED'}
                      </span>
                      <button
                        className="room-copy-btn"
                        title="Copy Room Name"
                        onClick={(e) => copyRoomName(r.room, e)}
                        aria-label={`Copy ${r.room}`}
                      >
                        {copiedRoom === r.room ? '✓' : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Occupancy Info */}
                  {!isFree && r.occupyingClass && (
                    <div className="room-occupied-info">
                      <p className="room-occupied-course">
                        📚 {r.occupyingClass.course} ({r.occupyingClass.section})
                      </p>
                      <p className="room-occupied-time">
                        {r.occupyingClass.startLabel} – {r.occupyingClass.endLabel}
                      </p>
                    </div>
                  )}

                  {/* Visual Day Schedule Mini-Bar */}
                  <div className="room-schedule-bar-wrap">
                    <div className="room-schedule-bar" title="Full Day Schedule (Green = Free, Gray = Occupied)">
                      {TIME_SLOTS.map((slot) => {
                        const isSlotFree = r.freeSlots.includes(slot);
                        const isCurrentSlot = selectedSlot === slot;
                        return (
                          <div
                            key={slot}
                            className={`room-bar-slot ${isSlotFree ? 'free' : 'busy'} ${isCurrentSlot ? 'highlight' : ''}`}
                            title={`${slot}: ${isSlotFree ? 'Free' : 'Occupied'}`}
                          />
                        );
                      })}
                    </div>
                    <span className="room-schedule-stat">
                      {r.totalFreeSlots} of {TIME_SLOTS.length} slots free
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Room Detail Sheet */}
      {selectedRoom && (
        <div
          className="sheet-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedRoom(null); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="sheet">
            <div className="sheet-handle" />

            <div className="sheet-header">
              <div>
                <p className="sheet-course" style={{ fontSize: 20 }}>{selectedRoom.room}</p>
                <p className="sheet-section">{selectedRoom.building} · {selectedRoom.type.toUpperCase()}</p>
              </div>
              <span className={`room-status-badge ${selectedRoom.isFree ? 'free' : 'busy'}`}>
                {selectedRoom.isFree ? 'Available' : 'Occupied'}
              </span>
            </div>

            <div className="sheet-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p className="field-label" style={{ margin: 0 }}>
                  {selectedDay}'s Classes in {selectedRoom.room}
                </p>
                <button
                  className="fac-sheet-copy"
                  onClick={() => copyRoomName(selectedRoom.room)}
                >
                  {copiedRoom === selectedRoom.room ? 'Copied ✓' : 'Copy Room'}
                </button>
              </div>

              {selectedRoom.occupiedSlots.length === 0 ? (
                <div className="fac-sheet-box" style={{ textAlign: 'center', padding: '24px 16px' }}>
                  <span style={{ fontSize: 24 }}>🎉</span>
                  <p style={{ fontWeight: 700, margin: '6px 0 2px', color: 'var(--ink-1)' }}>Free All Day!</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0 }}>
                    No classes are scheduled in this room on {selectedDay}.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '280px', overflowY: 'auto' }}>
                  {selectedRoom.occupiedSlots.map((occ, idx) => (
                    <div key={idx} className="sheet-row" style={{ padding: '9px 12px' }}>
                      <span className="sheet-row-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 6v6l4 2"/>
                        </svg>
                      </span>
                      <div className="sheet-row-content" style={{ flex: 1 }}>
                        <p className="sheet-row-label">{occ.slot} ({occ.startLabel} – {occ.endLabel})</p>
                        <p className="sheet-row-value" style={{ fontSize: 13 }}>
                          {occ.course} · <strong>{occ.section}</strong>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn-primary"
                onClick={() => setSelectedRoom(null)}
                style={{ marginTop: 12 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

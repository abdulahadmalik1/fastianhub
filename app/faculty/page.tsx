'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { FACULTY_DATA, FacultyMember } from '@/lib/facultyData';

const DEPARTMENTS = [
  'All',
  'Computer Science',
  'AI & Data Science',
  'Software Engineering',
  'Cyber Security',
  'Science & Humanities',
] as const;

type Department = typeof DEPARTMENTS[number];

function getInitials(name: string): string {
  const clean = name.replace(/^(Dr\.|Mr\.|Ms\.|Engr\.)\s+/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function getDeptColor(dept: string): { bg: string; color: string; border: string } {
  if (dept.includes('Computer Science')) return { bg: '#eef2ff', color: 'var(--indigo)', border: '#c7d2fe' };
  if (dept.includes('AI') || dept.includes('Data Science')) return { bg: '#f0fdfa', color: 'var(--teal)', border: '#99f6e4' };
  if (dept.includes('Software')) return { bg: '#fef3c7', color: 'var(--amber)', border: '#fde68a' };
  if (dept.includes('Cyber')) return { bg: '#ffe4e6', color: '#e11d48', border: '#fecdd3' };
  if (dept.includes('Science')) return { bg: '#f3e8ff', color: '#9333ea', border: '#e9d5ff' };
  return { bg: 'var(--raised)', color: 'var(--ink-1)', border: 'var(--line)' };
}

export default function FacultyDirectoryPage() {
  const [query, setQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department>('All');
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Close sheet on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedFaculty(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const copyToClipboard = (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredFaculty = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FACULTY_DATA.filter((item) => {
      // Dept filter
      if (selectedDept !== 'All') {
        if (!item.department.toLowerCase().includes(selectedDept.toLowerCase())) {
          return false;
        }
      }
      // Query filter
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.office.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.designation.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q)
      );
    });
  }, [query, selectedDept]);

  // Dept counts
  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = { All: FACULTY_DATA.length };
    for (const d of DEPARTMENTS) {
      if (d === 'All') continue;
      counts[d] = FACULTY_DATA.filter(f => f.department.toLowerCase().includes(d.toLowerCase())).length;
    }
    return counts;
  }, []);

  return (
    <div className="app-shell" style={{ paddingBottom: 60 }}>
      {/* Top Header */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" className="icon-btn" aria-label="Back to Timetable" title="Back to Timetable" id="back-to-home-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div className="topbar-left">
            <h1 className="topbar-title">Faculty Directory</h1>
            <p className="topbar-sub">
              FAST Islamabad · <span>{filteredFaculty.length} available</span>
            </p>
          </div>
        </div>

        <div className="topbar-actions">
          <span className="fac-stat-badge">
            {filteredFaculty.length} of {FACULTY_DATA.length}
          </span>
        </div>
      </header>

      {/* Search Bar */}
      <div style={{ padding: '0 20px', marginTop: 12, marginBottom: 14 }}>
        <div className="fac-search-wrapper">
          <svg className="fac-search-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="fac-search-input"
            placeholder="Search faculty name, office (e.g. C-201, D-101), email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            id="faculty-search-input"
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="fac-search-clear"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Department Tabs */}
      <nav className="fac-dept-nav" aria-label="Department filter">
        {DEPARTMENTS.map((dept) => {
          const isActive = selectedDept === dept;
          return (
            <button
              key={dept}
              className={`fac-dept-btn ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedDept(dept)}
              id={`dept-btn-${dept.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            >
              <span>{dept}</span>
              <span className="fac-dept-count">{deptCounts[dept] ?? 0}</span>
            </button>
          );
        })}
      </nav>

      {/* Faculty Cards List */}
      <main style={{ padding: '0 20px', marginTop: 16 }}>
        {filteredFaculty.length === 0 ? (
          <div className="fac-empty-state">
            <div className="fac-empty-icon">🔍</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 4px', color: 'var(--ink-1)' }}>
              No faculty found
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
              No results matching "{query}". Try checking the spelling or selecting another department.
            </p>
            <button
              onClick={() => { setQuery(''); setSelectedDept('All'); }}
              className="fac-reset-btn"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="fac-grid">
            {filteredFaculty.map((member) => {
              const deptStyle = getDeptColor(member.department);
              const isHoD = member.designation.toLowerCase().includes('hod') || member.designation.toLowerCase().includes('head');
              const isProf = member.designation.toLowerCase().includes('professor');

              return (
                <article
                  key={member.id}
                  className={`fac-card ${isHoD ? 'is-hod' : ''}`}
                  onClick={() => setSelectedFaculty(member)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${member.name}, ${member.designation}, Office ${member.office}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedFaculty(member);
                    }
                  }}
                >
                  <div className="fac-card-header">
                    <div className="fac-avatar" style={{ backgroundColor: deptStyle.bg, color: deptStyle.color }}>
                      {getInitials(member.name)}
                    </div>
                    <div className="fac-info">
                      <div className="fac-name-row">
                        <h2 className="fac-name">{member.name}</h2>
                        {isHoD && <span className="fac-hod-tag">Head</span>}
                      </div>
                      <p className="fac-desig">{member.designation}</p>
                      <span className="fac-dept-pill" style={{ color: deptStyle.color }}>
                        {member.department}
                      </span>
                    </div>
                  </div>

                  <div className="fac-card-footer">
                    {/* Office Tag */}
                    <button
                      className="fac-office-badge"
                      title="Click to copy office location"
                      onClick={(e) => copyToClipboard(member.office, `off-${member.id}`, e)}
                      id={`copy-office-${member.id}`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span className="fac-office-text">
                        {copiedId === `off-${member.id}` ? 'Copied!' : member.office}
                      </span>
                    </button>

                    {/* Email Action */}
                    <div className="fac-actions">
                      <button
                        className="fac-action-btn"
                        title="Copy Email"
                        onClick={(e) => copyToClipboard(member.email, `mail-${member.id}`, e)}
                        aria-label="Copy email address"
                      >
                        {copiedId === `mail-${member.id}` ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)' }}>✓</span>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        )}
                      </button>

                      <a
                        href={`mailto:${member.email}`}
                        className="fac-action-btn mail-link"
                        title="Send Email"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Send email to ${member.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* 1-Click Detail Sheet */}
      {selectedFaculty && (
        <div
          className="sheet-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedFaculty(null); }}
          role="dialog"
          aria-modal="true"
          aria-label="Faculty Details"
        >
          <div className="sheet">
            <div className="sheet-handle" />

            <div className="sheet-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  className="fac-avatar"
                  style={{
                    ...getDeptColor(selectedFaculty.department),
                    width: 44,
                    height: 44,
                    fontSize: 16
                  }}
                >
                  {getInitials(selectedFaculty.name)}
                </div>
                <div>
                  <p className="sheet-course" style={{ fontSize: 18, marginBottom: 2 }}>{selectedFaculty.name}</p>
                  <p className="sheet-section">{selectedFaculty.designation}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFaculty(null)}
                className="icon-btn"
                style={{ width: 32, height: 32 }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="sheet-body">
              {/* Office Highlight */}
              <div className="fac-sheet-box">
                <div className="fac-sheet-box-header">
                  <span className="sheet-row-label">Office Location</span>
                  <button
                    className="fac-sheet-copy"
                    onClick={() => copyToClipboard(selectedFaculty.office, 'sheet-office')}
                  >
                    {copiedId === 'sheet-office' ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
                <div className="fac-sheet-box-val">
                  📍 {selectedFaculty.office}
                </div>
              </div>

              {/* Email */}
              <div className="sheet-row">
                <span className="sheet-row-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <div className="sheet-row-content" style={{ flex: 1, minWidth: 0 }}>
                  <p className="sheet-row-label">Official Email</p>
                  <p className="sheet-row-value" style={{ wordBreak: 'break-all', fontSize: 13.5 }}>
                    {selectedFaculty.email}
                  </p>
                </div>
                <button
                  className="icon-btn"
                  style={{ width: 34, height: 34, flexShrink: 0 }}
                  title="Copy email"
                  onClick={() => copyToClipboard(selectedFaculty.email, 'sheet-email')}
                >
                  {copiedId === 'sheet-email' ? (
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)' }}>✓</span>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Department */}
              <div className="sheet-row">
                <span className="sheet-row-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </span>
                <div className="sheet-row-content">
                  <p className="sheet-row-label">Department</p>
                  <p className="sheet-row-value">{selectedFaculty.department}</p>
                </div>
              </div>

              {/* Direct 1-Click Action Button */}
              <a
                href={`mailto:${selectedFaculty.email}`}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  textDecoration: 'none',
                  marginTop: 12
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>Send Email to {selectedFaculty.name.split(' ')[0]}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import pastPapersData from '@/data/pastPapers.json';

interface PaperFile {
  fileName: string;
  subPath?: string;
  title: string;
  path: string;
  downloadUrl: string;
  size: number;
  fileType: string;
}

interface CourseGroup {
  course: string;
  semesterLabel: string;
  semesterNum: number | 'outlines';
  fileCount: number;
  files: PaperFile[];
}

function getCourseDescription(courseName: string): string {
  const lower = courseName.toLowerCase();
  if (lower.includes('lab')) {
    return 'Practical task sheets, lab manuals, viva questions, and terminal exams.';
  }
  if (lower.includes('calculus') || lower.includes('differential') || lower.includes('linear algebra') || lower.includes('probability')) {
    return 'Mathematical derivations, analytical problem sets, and past examination papers.';
  }
  if (lower.includes('physics')) {
    return 'Core physics concepts, problem sheets, midterms, and past final exam papers.';
  }
  if (lower.includes('programming') || lower.includes('pf') || lower.includes('oop') || lower.includes('data structure') || lower.includes('algo') || lower.includes('dsa')) {
    return 'Programming theory, algorithm analysis, code tracing, and past sessionals.';
  }
  if (lower.includes('database') || lower.includes('sql') || lower.includes('adc')) {
    return 'Database architecture, query design, normalization, sessionals, and final exams.';
  }
  if (lower.includes('operating') || lower.includes('os') || lower.includes('aos')) {
    return 'Process scheduling, concurrency, memory management, and past final exams.';
  }
  if (lower.includes('architecture') || lower.includes('dld') || lower.includes('digital logic') || lower.includes('aca')) {
    return 'Logic circuits, processor architectures, instruction sets, and examination papers.';
  }
  if (lower.includes('english') || lower.includes('communication') || lower.includes('writing')) {
    return 'Reading comprehension, presentation mechanics, and past semester exam papers.';
  }
  if (lower.includes('pakistan') || lower.includes('islamic') || lower.includes('civics')) {
    return 'Historical context, socio-cultural frameworks, midterms, and final exam papers.';
  }
  if (lower.includes('accounting') || lower.includes('finance') || lower.includes('a&f')) {
    return 'Financial resource reporting, ledger management, balance sheets, and past exams.';
  }
  return 'Curated collection of midterm sessionals, quizzes, assignments, and past final papers.';
}

export default function PastPapersPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseGroup | null>(null);
  const [sheetFilter, setSheetFilter] = useState<string>('all');
  const [sheetSearch, setSheetSearch] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Compile all courses (excluding readmes)
  const allCourses = useMemo((): CourseGroup[] => {
    const list: CourseGroup[] = [];

    // Semesters 1-8
    const sems = (pastPapersData.semesters || []) as Array<{
      semester: number;
      courses: Array<{ course: string; fileCount: number; files: PaperFile[] }>;
    }>;
    for (const sem of sems) {
      for (const c of sem.courses) {
        const cleanFiles = c.files.filter(
          (f) =>
            !f.fileName.toLowerCase().startsWith('readme') &&
            !f.fileName.toLowerCase().endsWith('.md') &&
            f.fileName !== '.gitkeep'
        );
        if (cleanFiles.length === 0) continue;
        list.push({
          course: c.course,
          semesterLabel: `Semester ${sem.semester}`,
          semesterNum: sem.semester,
          fileCount: cleanFiles.length,
          files: cleanFiles,
        });
      }
    }

    // Outlines
    const outlineGroups = (pastPapersData.outlines || []) as Array<{
      group: string;
      courses: Array<{ course: string; fileCount: number; files: PaperFile[] }>;
    }>;
    for (const grp of outlineGroups) {
      for (const c of grp.courses) {
        const cleanFiles = c.files.filter(
          (f) =>
            !f.fileName.toLowerCase().startsWith('readme') &&
            !f.fileName.toLowerCase().endsWith('.md') &&
            f.fileName !== '.gitkeep'
        );
        if (cleanFiles.length === 0) continue;
        list.push({
          course: `${c.course} (${grp.group})`,
          semesterLabel: `Outlines · ${grp.group}`,
          semesterNum: 'outlines',
          fileCount: cleanFiles.length,
          files: cleanFiles,
        });
      }
    }

    return list;
  }, []);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    let result = allCourses;

    if (selectedFilter === 'outlines') {
      result = result.filter((c) => c.semesterNum === 'outlines');
    } else if (selectedFilter !== 'all') {
      const semNum = parseInt(selectedFilter, 10);
      result = result.filter((c) => c.semesterNum === semNum);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((c) => {
        const titleMatch = c.course.toLowerCase().includes(q);
        const fileMatch = c.files.some(
          (f) =>
            f.title.toLowerCase().includes(q) ||
            f.fileName.toLowerCase().includes(q)
        );
        return titleMatch || fileMatch;
      });
    }

    return result;
  }, [allCourses, selectedFilter, searchQuery]);

  // Filter papers in bottom sheet
  const sheetFilteredFiles = useMemo(() => {
    if (!selectedCourse) return [];
    let files = selectedCourse.files;

    if (sheetFilter === 'finals') {
      files = files.filter((f) => f.title.toLowerCase().includes('final'));
    } else if (sheetFilter === 'sessionals') {
      files = files.filter(
        (f) =>
          f.title.toLowerCase().includes('sessional') ||
          f.title.toLowerCase().includes('mid')
      );
    } else if (sheetFilter === 'others') {
      files = files.filter(
        (f) =>
          !f.title.toLowerCase().includes('final') &&
          !f.title.toLowerCase().includes('sessional') &&
          !f.title.toLowerCase().includes('mid')
      );
    }

    const q = sheetSearch.trim().toLowerCase();
    if (q) {
      files = files.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.fileName.toLowerCase().includes(q)
      );
    }

    return files;
  }, [selectedCourse, sheetFilter, sheetSearch]);

  const copyFileLink = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/api/papers?path=${encodeURIComponent(filePath)}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(filePath);
    setTimeout(() => setCopiedUrl(null), 1800);
  };

  return (
    <div className="app-shell" style={{ paddingBottom: 64 }}>
      {/* Top Header */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/"
            className="icon-btn"
            aria-label="Back to Timetable"
            title="Back to Timetable"
            id="back-home-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="topbar-left">
            <h1 className="topbar-title">Past Papers & Resources</h1>
            <p className="topbar-sub">FAST Islamabad</p>
          </div>
        </div>
      </header>

      {/* Filter by Semester - Clean horizontal scroller */}
      <div style={{ padding: '0 20px', marginTop: 14 }}>
        <p className="field-label">Filter by Semester</p>
      </div>
      <nav className="day-selector" aria-label="Semester filter" style={{ marginTop: 2 }}>
        <button
          className={`day-btn${selectedFilter === 'all' ? ' active' : ''}`}
          onClick={() => setSelectedFilter('all')}
        >
          <span className="day-name">All</span>
        </button>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
          <button
            key={sem}
            id={`paper-sem-${sem}`}
            className={`day-btn${selectedFilter === String(sem) ? ' active' : ''}`}
            onClick={() => setSelectedFilter(String(sem))}
          >
            <span className="day-name">Sem {sem}</span>
          </button>
        ))}
        <button
          id="paper-outlines-tab"
          className={`day-btn${selectedFilter === 'outlines' ? ' active' : ''}`}
          onClick={() => setSelectedFilter('outlines')}
          style={{ minWidth: 72 }}
        >
          <span className="day-name">Outlines</span>
        </button>
      </nav>

      {/* Search Input - Full Width & Gorgeous */}
      <div style={{ padding: '0 20px', marginTop: 14, marginBottom: 16 }}>
        <div className="search-wrap">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects (e.g. Calculus, AP, Functional English)..."
            aria-label="Search past papers"
            id="past-papers-search-input"
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Clean Minimalist Card Grid */}
      <main style={{ padding: '0 20px' }}>
        {filteredCourses.length === 0 ? (
          <div className="fac-empty-state">
            <div className="fac-empty-icon">📁</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 4px', color: 'var(--ink-1)' }}>
              No subjects found
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
              {searchQuery
                ? `No courses matching "${searchQuery}"`
                : 'No documents in this category.'}
            </p>
            {searchQuery && (
              <button
                className="fac-reset-btn"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="ff-card-grid">
            {filteredCourses.map((group) => {
              const desc = getCourseDescription(group.course);

              return (
                <article
                  key={group.course}
                  className="ff-paper-card"
                  onClick={() => {
                    setSelectedCourse(group);
                    setSheetFilter('all');
                    setSheetSearch('');
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={group.course}
                >
                  {/* Top Tag Row */}
                  <div className="ff-card-header-row">
                    <span className="ff-card-semester-tag">
                      {group.semesterLabel}
                    </span>
                  </div>

                  {/* Course Title */}
                  <h2 className="ff-card-title">{group.course}</h2>

                  {/* Course Description */}
                  <p className="ff-card-desc">{desc}</p>

                  {/* Clean Action Footer */}
                  <div className="ff-card-footer">
                    <span className="ff-card-action-text">
                      Browse Papers
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* FastiFlex Fluid Bottom Sheet */}
      {selectedCourse && (
        <div
          className="sheet-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCourse(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="sheet">
            <div className="sheet-handle" />

            {/* Sheet Header */}
            <div className="sheet-header">
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="sheet-course" style={{ fontSize: 18, wordBreak: 'break-word' }}>
                  {selectedCourse.course}
                </p>
                <p className="sheet-section">
                  {selectedCourse.semesterLabel}
                </p>
              </div>

              <button
                className="icon-btn"
                onClick={() => setSelectedCourse(null)}
                aria-label="Close"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Internal Category Filter Chips */}
            <div style={{ padding: '0 20px', marginTop: 10, display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
              <button
                className={`ff-sheet-tab ${sheetFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSheetFilter('all')}
              >
                All
              </button>
              <button
                className={`ff-sheet-tab ${sheetFilter === 'finals' ? 'active' : ''}`}
                onClick={() => setSheetFilter('finals')}
              >
                Finals
              </button>
              <button
                className={`ff-sheet-tab ${sheetFilter === 'sessionals' ? 'active' : ''}`}
                onClick={() => setSheetFilter('sessionals')}
              >
                Sessionals / Mids
              </button>
              <button
                className={`ff-sheet-tab ${sheetFilter === 'others' ? 'active' : ''}`}
                onClick={() => setSheetFilter('others')}
              >
                Quizzes & Outlines
              </button>
            </div>

            {/* Filter Input inside sheet if >4 files */}
            {selectedCourse.files.length > 4 && (
              <div style={{ padding: '0 20px', marginTop: 10 }}>
                <div className="search-wrap" style={{ height: 38 }}>
                  <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="text"
                    className="search-input"
                    value={sheetSearch}
                    onChange={(e) => setSheetSearch(e.target.value)}
                    placeholder="Search within this course..."
                    style={{ fontSize: 13 }}
                  />
                  {sheetSearch && (
                    <button
                      className="search-clear-btn"
                      onClick={() => setSheetSearch('')}
                      aria-label="Clear filter"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Papers List */}
            <div className="sheet-body" style={{ maxHeight: '58dvh', overflowY: 'auto', marginTop: 8 }}>
              {sheetFilteredFiles.length === 0 ? (
                <div className="fac-empty-state" style={{ padding: '24px 16px' }}>
                  <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
                    No papers in this category.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sheetFilteredFiles.map((file) => {
                    const viewUrl = `/api/papers?path=${encodeURIComponent(file.path)}`;
                    const downloadUrl = `/api/papers?path=${encodeURIComponent(file.path)}&download=true`;

                    return (
                      <div key={file.path} className="paper-file-row" style={{ borderRadius: 10, border: '1px solid var(--line)' }}>
                        <div className="paper-file-left">
                          {/* Clean subtle document icon - NO RED PDF BADGE */}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-3)', flexShrink: 0 }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>

                          <div className="paper-file-info">
                            <p className="paper-file-title" title={file.fileName}>
                              {file.title}
                            </p>
                          </div>
                        </div>

                        <div className="paper-file-actions">
                          {/* Copy link */}
                          <button
                            className="paper-action-icon-btn"
                            title="Copy Direct Link"
                            onClick={(e) => copyFileLink(file.path, e)}
                            aria-label="Copy file link"
                          >
                            {copiedUrl === file.path ? (
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>✓</span>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                              </svg>
                            )}
                          </button>

                          {/* View in new tab (Proxied through FastiFlex API) */}
                          <a
                            href={viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="paper-action-icon-btn"
                            title="View Document"
                            aria-label={`View ${file.title}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </a>

                          {/* Direct Download (Proxied through FastiFlex API) */}
                          <a
                            href={downloadUrl}
                            download={file.fileName}
                            className="paper-download-btn"
                            title="Direct Download"
                            aria-label={`Download ${file.title}`}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                className="btn-primary"
                onClick={() => setSelectedCourse(null)}
                style={{ marginTop: 14 }}
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

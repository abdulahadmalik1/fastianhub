'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import pastPapersData from '@/data/pastPapers.json';

export type CampusId = 'islamabad' | 'karachi' | 'lahore' | 'cfd' | 'central';

interface PaperFile {
  fileName: string;
  subPath?: string;
  title: string;
  path: string;
  downloadUrl: string;
  size: number;
  fileType: string;
  campus?: CampusId;
  category?: 'final' | 'sessional' | 'quiz' | 'assignment' | 'lab' | 'project' | 'outline' | 'book_notes' | 'additional';
  categoryLabel?: string;
  badge?: string;
  isSolution?: boolean;
  badgeColor?: string;
}

interface CourseGroup {
  course: string;
  semesterLabel: string;
  semesterNum: number | 'outlines';
  fileCount: number;
  files: PaperFile[];
  campus: CampusId;
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
  if (lower.includes('architecture') || lower.includes('coal') || lower.includes('dld') || lower.includes('digital logic') || lower.includes('assembly')) {
    return 'Logic circuits, processor architectures, instruction sets, and examination papers.';
  }
  if (lower.includes('network') || lower.includes('security') || lower.includes('ncys')) {
    return 'Protocols, packet analysis, cryptography, network configuration, and exam papers.';
  }
  if (lower.includes('ai') || lower.includes('intelligence') || lower.includes('learning') || lower.includes('retrieval')) {
    return 'Search algorithms, neural representations, perceptron models, and past exams.';
  }
  if (lower.includes('english') || lower.includes('communication') || lower.includes('writing')) {
    return 'Reading comprehension, presentation mechanics, and past semester exam papers.';
  }
  if (lower.includes('pakistan') || lower.includes('islamic') || lower.includes('civics') || lower.includes('professional') || lower.includes('marketing')) {
    return 'Course materials, study notes, midterms, and final exam papers.';
  }
  return 'Curated collection of midterm sessionals, quizzes, assignments, and past final papers.';
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function PastPapersPage() {
  const [activeCampus, setActiveCampus] = useState<CampusId>('islamabad');
  const [isCampusMenuOpen, setIsCampusMenuOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseGroup | null>(null);
  const [sheetFilter, setSheetFilter] = useState<string>('all');
  const [sheetSearch, setSheetSearch] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load campus preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fastiflex_past_papers_campus') as CampusId;
      if (saved === 'islamabad' || saved === 'karachi' || saved === 'lahore' || saved === 'cfd' || saved === 'central') {
        setActiveCampus(saved === 'central' ? 'lahore' : saved);
      }
    } catch (e) {}

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCampusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchCampus = (campus: CampusId) => {
    const effective = campus === 'central' ? 'lahore' : campus;
    setActiveCampus(effective);
    try {
      localStorage.setItem('fastiflex_past_papers_campus', effective);
    } catch (e) {}
    setSelectedCourse(null);
    setSelectedFilter('all');
    setSheetFilter('all');
    setSearchQuery('');
    setSheetSearch('');
    setIsCampusMenuOpen(false);
  };

  // Extract campus payload from JSON
  const currentCampusData = useMemo(() => {
    const raw = pastPapersData as any;
    const campusKey = activeCampus === 'central' ? 'lahore' : activeCampus;
    if (raw.campuses && raw.campuses[campusKey]) {
      return raw.campuses[campusKey];
    }
    const nameMap: Record<CampusId, string> = {
      islamabad: 'FAST Islamabad',
      karachi: 'FAST Karachi',
      lahore: 'FAST Lahore',
      cfd: 'FAST CFD',
      central: 'FAST Lahore'
    };
    const shortMap: Record<CampusId, string> = {
      islamabad: 'Islamabad',
      karachi: 'Karachi',
      lahore: 'Lahore',
      cfd: 'CFD',
      central: 'Lahore'
    };
    return {
      id: campusKey,
      name: nameMap[campusKey] || 'FAST Lahore',
      shortName: shortMap[campusKey] || 'Lahore',
      totalFiles: 0,
      semesters: raw.semesters || [],
      outlines: raw.outlines || []
    };
  }, [activeCampus]);

  // Compile all courses for the active campus
  const allCourses = useMemo((): CourseGroup[] => {
    const list: CourseGroup[] = [];

    // Semesters 1-8
    const sems = (currentCampusData.semesters || []) as Array<{
      semester: number;
      courses: Array<{ course: string; fileCount: number; files: PaperFile[] }>;
    }>;

    for (const sem of sems) {
      for (const c of sem.courses) {
        const cleanFiles = (c.files || []).filter(
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
          campus: activeCampus
        });
      }
    }

    // Outlines (if present, e.g. Islamabad)
    const outlineGroups = (currentCampusData.outlines || []) as Array<{
      group: string;
      courses: Array<{ course: string; fileCount: number; files: PaperFile[] }>;
    }>;

    for (const grp of outlineGroups) {
      for (const c of grp.courses) {
        const cleanFiles = (c.files || []).filter(
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
          campus: activeCampus
        });
      }
    }

    return list;
  }, [currentCampusData, activeCampus]);

  // Filtered courses based on semester button & search bar
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

  // Dynamic available categories for the selected course sheet
  const availableCourseCategories = useMemo(() => {
    if (!selectedCourse) return [];
    const counts: Record<string, number> = {};
    selectedCourse.files.forEach((f) => {
      const cat = f.category || 'additional';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const categoryDefinitions: Array<{ key: string; label: string; count: number }> = [
      { key: 'all', label: `All (${selectedCourse.files.length})`, count: selectedCourse.files.length },
      { key: 'final', label: `Finals (${counts['final'] || 0})`, count: counts['final'] || 0 },
      { key: 'sessional', label: `Mids / Sessionals (${counts['sessional'] || 0})`, count: counts['sessional'] || 0 },
      { key: 'quiz', label: `Quizzes (${counts['quiz'] || 0})`, count: counts['quiz'] || 0 },
      { key: 'assignment', label: `Assignments (${counts['assignment'] || 0})`, count: counts['assignment'] || 0 },
      { key: 'lab', label: `Labs & Tasks (${counts['lab'] || 0})`, count: counts['lab'] || 0 },
      { key: 'project', label: `Projects (${counts['project'] || 0})`, count: counts['project'] || 0 },
      { key: 'outline', label: `Outlines (${counts['outline'] || 0})`, count: counts['outline'] || 0 },
      { key: 'book_notes', label: `Notes & Books (${counts['book_notes'] || 0})`, count: counts['book_notes'] || 0 },
      { key: 'additional', label: `Additional (${counts['additional'] || 0})`, count: counts['additional'] || 0 },
    ];

    return categoryDefinitions.filter((item) => item.key === 'all' || item.count > 0);
  }, [selectedCourse]);

  // Filter files inside the bottom sheet
  const sheetFilteredFiles = useMemo(() => {
    if (!selectedCourse) return [];
    let files = selectedCourse.files;

    if (sheetFilter !== 'all') {
      files = files.filter((f) => {
        const cat = f.category || 'additional';
        return cat === sheetFilter;
      });
    }

    const q = sheetSearch.trim().toLowerCase();
    if (q) {
      files = files.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.fileName.toLowerCase().includes(q) ||
          (f.badge && f.badge.toLowerCase().includes(q))
      );
    }

    return files;
  }, [selectedCourse, sheetFilter, sheetSearch]);

  const hasOutlines = useMemo(() => {
    return allCourses.some((c) => c.semesterNum === 'outlines');
  }, [allCourses]);

  return (
    <div className="app-shell" style={{ paddingBottom: 64 }}>
      {/* Top Header */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/timetable"
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
            <p className="topbar-sub">
              {currentCampusData.name}
            </p>
          </div>
        </div>

        {/* Minimalistic Campus Source Dropdown Button */}
        <div className="topbar-actions">
          <div className="campus-dropdown-wrap" ref={dropdownRef}>
            <button
              className="campus-source-toggle"
              onClick={() => setIsCampusMenuOpen(!isCampusMenuOpen)}
              aria-haspopup="true"
              aria-expanded={isCampusMenuOpen}
              id="campus-source-toggle-btn"
              title="Click to switch past paper archive"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--indigo)' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{currentCampusData.shortName}</span>
              <svg className={`campus-toggle-arrow ${isCampusMenuOpen ? 'open' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isCampusMenuOpen && (
              <div className="campus-dropdown-menu">
                <div className="campus-dropdown-title">Select Past Paper Archive</div>
                <button
                  className={`campus-dropdown-item ${activeCampus === 'islamabad' ? 'active' : ''}`}
                  onClick={() => switchCampus('islamabad')}
                  id="select-campus-islamabad"
                >
                  <div className="campus-item-text">
                    <span className="campus-item-name">FAST Islamabad</span>
                    <span className="campus-item-desc">504 papers · Semesters 1-8 & Outlines</span>
                  </div>
                  {activeCampus === 'islamabad' && <span className="campus-item-check">✓</span>}
                </button>

                <button
                  className={`campus-dropdown-item ${activeCampus === 'karachi' ? 'active' : ''}`}
                  onClick={() => switchCampus('karachi')}
                  id="select-campus-karachi"
                >
                  <div className="campus-item-text">
                    <span className="campus-item-name">FAST Karachi</span>
                    <span className="campus-item-desc">154 files · Quizzes, Mids, Finals & Labs</span>
                  </div>
                  {activeCampus === 'karachi' && <span className="campus-item-check">✓</span>}
                </button>

                <button
                  className={`campus-dropdown-item ${activeCampus === 'lahore' || activeCampus === 'central' ? 'active' : ''}`}
                  onClick={() => switchCampus('lahore')}
                  id="select-campus-lahore"
                >
                  <div className="campus-item-text">
                    <span className="campus-item-name">FAST Lahore</span>
                    <span className="campus-item-desc">6,100+ files · 120+ Courses, Mids, Finals & Labs</span>
                  </div>
                  {(activeCampus === 'lahore' || activeCampus === 'central') && <span className="campus-item-check">✓</span>}
                </button>

                <button
                  className={`campus-dropdown-item ${activeCampus === 'cfd' ? 'active' : ''}`}
                  onClick={() => switchCampus('cfd')}
                  id="select-campus-cfd"
                >
                  <div className="campus-item-text">
                    <span className="campus-item-name">FAST CFD</span>
                    <span className="campus-item-desc">115+ files · Labs, Past Exams, Slides & Solutions</span>
                  </div>
                  {activeCampus === 'cfd' && <span className="campus-item-check">✓</span>}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Filter by Semester */}
      <div style={{ padding: '0 20px', marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="field-label" style={{ margin: 0 }}>Filter by Semester</p>
          <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>
            {currentCampusData.name}
          </span>
        </div>
      </div>
      <nav className="day-selector" aria-label="Semester filter" style={{ marginTop: 4 }}>
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
        {hasOutlines && (
          <button
            id="paper-outlines-tab"
            className={`day-btn${selectedFilter === 'outlines' ? ' active' : ''}`}
            onClick={() => setSelectedFilter('outlines')}
            style={{ minWidth: 72 }}
          >
            <span className="day-name">Outlines</span>
          </button>
        )}
      </nav>

      {/* Search Input */}
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
            placeholder={`Search ${currentCampusData.shortName} courses & past papers (e.g. Calculus, OS, Algorithms)...`}
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

      {/* Course Cards Grid */}
      <main style={{ padding: '0 20px' }}>
        {filteredCourses.length === 0 ? (
          <div className="fac-empty-state">
            <div className="fac-empty-icon">📁</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 4px', color: 'var(--ink-1)' }}>
              No courses found
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
              {searchQuery
                ? `No courses matching "${searchQuery}" in ${currentCampusData.name}.`
                : 'No documents in this semester filter.'}
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
                  {/* Course Title */}
                  <h2 className="ff-card-title">{group.course}</h2>

                  {/* Course Description */}
                  <p className="ff-card-desc">{desc}</p>

                  {/* Action Footer */}
                  <div className="ff-card-footer">
                    <span className="ff-card-action-text">
                      Browse Material
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

      {/* FastiFlex Dynamic Bottom Sheet for Course Materials */}
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
                <p className="sheet-course" style={{ fontSize: 18, wordBreak: 'break-word', margin: '0 0 2px' }}>
                  {selectedCourse.course}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span className="sheet-section" style={{ margin: 0 }}>
                    {selectedCourse.semesterLabel}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--indigo)', background: 'rgba(79, 70, 229, 0.08)', padding: '1px 6px', borderRadius: 4 }}>
                    {currentCampusData.shortName}
                  </span>
                </div>
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

            {/* Dynamic Category Filter Tabs (Only show materials that exist!) */}
            <div style={{ padding: '0 20px', marginTop: 10, display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {availableCourseCategories.map((cat) => (
                <button
                  key={cat.key}
                  className={`ff-sheet-tab ${sheetFilter === cat.key ? 'active' : ''}`}
                  onClick={() => setSheetFilter(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Filter Input inside sheet if course has more than 3 files */}
            {selectedCourse.files.length > 3 && (
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
                    placeholder="Search inside this course..."
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
                    No materials found in this category.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sheetFilteredFiles.map((file) => {
                    const viewUrl = `/api/papers?path=${encodeURIComponent(file.path)}&source=${activeCampus}`;
                    const downloadUrl = `/api/papers?path=${encodeURIComponent(file.path)}&source=${activeCampus}&download=true`;

                    const catClass = file.category ? `mat-badge-${file.category}` : 'mat-badge-additional';
                    const badgeText = file.badge || file.categoryLabel || 'Material';

                    return (
                      <div key={file.path} className="paper-file-row" style={{ borderRadius: 10, border: '1px solid var(--line)', padding: '10px 14px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0, flex: 1 }}>
                          {/* File Icon */}
                          <div style={{ marginTop: 2, flexShrink: 0 }}>
                            {file.fileType === 'image' ? (
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--indigo)' }}>
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                              </svg>
                            ) : file.fileType === 'doc' ? (
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0284c7' }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                              </svg>
                            ) : (
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-2)' }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                            )}
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            {/* File Title */}
                            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-1)', margin: '0 0 4px', wordBreak: 'break-word', lineHeight: 1.35 }} title={file.fileName}>
                              {file.title || file.fileName}
                            </p>

                            {/* Dynamic Badges with Identification */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span className={`mat-badge ${catClass}`}>
                                {badgeText}
                              </span>

                              {file.isSolution && (
                                <span className="mat-badge mat-badge-solved">
                                  ✓ Solved
                                </span>
                              )}

                              <span style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 500 }}>
                                {file.fileType.toUpperCase()}{file.size ? ` · ${formatBytes(file.size)}` : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <a
                            href={viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="paper-action-btn view"
                            title="View document inline"
                            style={{ textDecoration: 'none', padding: '5px 10px', borderRadius: 'var(--r-m)', fontSize: 12, fontWeight: 600, color: 'var(--indigo)', background: 'rgba(79, 70, 229, 0.08)', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <span>View</span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>

                          <a
                            href={downloadUrl}
                            download
                            className="paper-action-btn download"
                            title="Download document"
                            style={{ textDecoration: 'none', padding: '5px 9px', borderRadius: 'var(--r-m)', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', background: 'var(--raised)', border: '1px solid var(--line)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <span>Save</span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

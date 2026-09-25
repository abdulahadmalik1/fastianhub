'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import pastPapersData from '@/data/pastPapers.json';
import SubmitRepoModal from '@/components/SubmitRepoModal';
import FeedbackModal from '@/components/FeedbackModal';
import CourseCard from '@/components/CourseCard';
import CourseDetailsSheet from '@/components/CourseDetailsSheet';
import { CampusId, PaperFile, CourseGroup, CampusMetadata } from '@/lib/papers';

const CAMPUS_NAMES: Record<CampusId, string> = {
  islamabad: 'FAST Islamabad',
  karachi: 'FAST Karachi',
  lahore: 'FAST Lahore',
  cfd: 'FAST CFD',
  central: 'FAST Lahore',
};

const CAMPUS_SHORT_NAMES: Record<CampusId, string> = {
  islamabad: 'Islamabad',
  karachi: 'Karachi',
  lahore: 'Lahore',
  cfd: 'CFD',
  central: 'Lahore',
};

export default function PastPapersView() {
  const [activeCampus, setActiveCampus] = useState<CampusId>('islamabad');
  const [isCampusMenuOpen, setIsCampusMenuOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseGroup | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [bookmarkedCourses, setBookmarkedCourses] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load campus preference and bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = (localStorage.getItem('fastianhub_past_papers_campus') || localStorage.getItem('fastiflex_past_papers_campus')) as CampusId;
      if (saved === 'islamabad' || saved === 'karachi' || saved === 'lahore' || saved === 'cfd' || saved === 'central') {
        setActiveCampus(saved === 'central' ? 'lahore' : saved);
      }
    } catch (e) {}

    try {
      const savedBookmarks = localStorage.getItem('fastianhub_bookmarked_courses') || localStorage.getItem('fastiflex_bookmarked_courses');
      if (savedBookmarks) {
        const parsed = JSON.parse(savedBookmarks);
        if (Array.isArray(parsed)) {
          setBookmarkedCourses(parsed);
        }
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
      localStorage.setItem('fastianhub_past_papers_campus', effective);
    } catch (e) {}
    setSelectedCourse(null);
    setSelectedFilter('all');
    setSearchQuery('');
    setIsCampusMenuOpen(false);
  };

  const toggleBookmark = (courseName: string) => {
    setBookmarkedCourses((prev) => {
      const next = prev.includes(courseName)
        ? prev.filter((c) => c !== courseName)
        : [...prev, courseName];
      try {
        localStorage.setItem('fastianhub_bookmarked_courses', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Extract campus payload from JSON
  const currentCampusData: CampusMetadata = useMemo(() => {
    const raw = pastPapersData as any;
    const campusKey = activeCampus === 'central' ? 'lahore' : activeCampus;
    if (raw.campuses && raw.campuses[campusKey]) {
      return raw.campuses[campusKey];
    }
    return {
      id: campusKey,
      name: CAMPUS_NAMES[campusKey] || 'FAST Lahore',
      shortName: CAMPUS_SHORT_NAMES[campusKey] || 'Lahore',
      totalFiles: 0,
      semesters: raw.semesters || [],
      outlines: raw.outlines || [],
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
          campus: activeCampus,
        });
      }
    }

    // Outlines (e.g. Islamabad)
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
          campus: activeCampus,
        });
      }
    }

    return list;
  }, [currentCampusData, activeCampus]);

  // Filtered courses based on semester button & search bar
  const filteredCourses = useMemo(() => {
    let result = allCourses;

    if (selectedFilter === 'starred') {
      result = result.filter((c) => bookmarkedCourses.includes(c.course));
    } else if (selectedFilter === 'outlines') {
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
  }, [allCourses, selectedFilter, searchQuery, bookmarkedCourses]);

  const starredCountInCampus = useMemo(() => {
    return allCourses.filter((c) => bookmarkedCourses.includes(c.course)).length;
  }, [allCourses, bookmarkedCourses]);

  const hasOutlines = useMemo(() => {
    return allCourses.some((c) => c.semesterNum === 'outlines');
  }, [allCourses]);

  return (
    <div className="app-shell" style={{ paddingBottom: 64 }}>
      {/* Top Header */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'inherit',
            }}
            id="app-home-link"
          >
            <div className="topbar-left">
              <h1 className="topbar-title">FastianHub Past Papers</h1>
              <p className="topbar-sub">
                {currentCampusData.name}
              </p>
            </div>
          </Link>
        </div>

        {/* Action Buttons: Credits, Contribute, Feedback, Campus Switcher */}
        <div className="topbar-actions">
          <Link
            href="/credits"
            className="topbar-contributors-btn"
            id="topbar-credits-link"
            title="Open-source credits and attribution"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Credits</span>
          </Link>

          <button
            className="submit-repo-toggle"
            onClick={() => setIsSubmitModalOpen(true)}
            id="open-submit-repo-btn"
            title="Contribute a past paper repository"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Contribute Repo</span>
          </button>

          <button
            className="topbar-feedback-btn"
            onClick={() => setIsFeedbackModalOpen(true)}
            id="open-feedback-btn"
            title="Suggestions, feedback, or request new tools"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Feedback</span>
          </button>

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
        {bookmarkedCourses.length > 0 && (
          <button
            id="paper-starred-tab"
            className={`day-btn${selectedFilter === 'starred' ? ' active' : ''}`}
            onClick={() => setSelectedFilter('starred')}
            title="View bookmarked courses"
            style={
              selectedFilter === 'starred'
                ? { background: '#6366f1', borderColor: '#6366f1', color: '#ffffff' }
                : { color: '#6366f1', background: 'rgba(99, 102, 241, 0.06)', borderColor: 'rgba(99, 102, 241, 0.22)' }
            }
          >
            <span className="day-name" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>★</span>
              <span>Saved{starredCountInCampus > 0 ? ` (${starredCountInCampus})` : ''}</span>
            </span>
          </button>
        )}
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
            <div className="fac-empty-icon">{selectedFilter === 'starred' ? '🔖' : '📁'}</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 4px', color: 'var(--ink-1)' }}>
              {selectedFilter === 'starred' ? 'No saved bookmarks' : 'No courses found'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
              {selectedFilter === 'starred'
                ? 'You have not bookmarked any courses yet. Click the star icon on any course box to save it here.'
                : searchQuery
                ? `No courses matching "${searchQuery}" in ${currentCampusData.name}.`
                : 'No documents in this semester filter.'}
            </p>
            {(searchQuery || selectedFilter === 'starred') && (
              <button
                className="fac-reset-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilter('all');
                }}
              >
                {selectedFilter === 'starred' ? 'Browse All Courses' : 'Clear Search'}
              </button>
            )}
          </div>
        ) : (
          <div className="ff-card-grid">
            {filteredCourses.map((group) => (
              <CourseCard
                key={group.course}
                group={group}
                isBookmarked={bookmarkedCourses.includes(group.course)}
                onSelect={(grp) => setSelectedCourse(grp)}
                onToggleBookmark={toggleBookmark}
              />
            ))}
          </div>
        )}
      </main>

      {/* Course Materials Bottom Sheet */}
      {selectedCourse && (
        <CourseDetailsSheet
          course={selectedCourse}
          campusShortName={currentCampusData.shortName}
          activeCampus={activeCampus}
          isBookmarked={bookmarkedCourses.includes(selectedCourse.course)}
          onClose={() => setSelectedCourse(null)}
          onToggleBookmark={toggleBookmark}
        />
      )}

      {/* Submit Repo Modal */}
      <SubmitRepoModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
      />

      {/* Feedback & Suggestions Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
}

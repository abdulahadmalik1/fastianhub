'use client';

import { useState, useMemo } from 'react';
import { CourseGroup, CampusId, formatBytes } from '@/lib/papers';

interface CourseDetailsSheetProps {
  course: CourseGroup;
  campusShortName: string;
  activeCampus: CampusId;
  isBookmarked: boolean;
  onClose: () => void;
  onToggleBookmark: (courseName: string) => void;
}

export default function CourseDetailsSheet({
  course,
  campusShortName,
  activeCampus,
  isBookmarked,
  onClose,
  onToggleBookmark,
}: CourseDetailsSheetProps) {
  const [sheetFilter, setSheetFilter] = useState<string>('all');
  const [sheetSearch, setSheetSearch] = useState('');

  // Dynamic available categories for the course
  const availableCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    course.files.forEach((f) => {
      const cat = f.category || 'additional';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const categoryDefinitions: Array<{ key: string; label: string; count: number }> = [
      { key: 'all', label: `All (${course.files.length})`, count: course.files.length },
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
  }, [course]);

  // Filter files inside the bottom sheet
  const filteredFiles = useMemo(() => {
    let files = course.files;

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
  }, [course, sheetFilter, sheetSearch]);

  return (
    <div
      className="sheet-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
              {course.course}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span className="sheet-section" style={{ margin: 0 }}>
                {course.semesterLabel}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--indigo)', background: 'rgba(79, 70, 229, 0.08)', padding: '1px 6px', borderRadius: 4 }}>
                {campusShortName}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className={`ff-star-btn ${isBookmarked ? 'starred' : ''}`}
              onClick={() => onToggleBookmark(course.course)}
              aria-label={isBookmarked ? `Unstar ${course.course}` : `Star ${course.course}`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark this course'}
              style={{ width: 32, height: 32 }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill={isBookmarked ? '#6366f1' : 'none'}
                stroke={isBookmarked ? '#6366f1' : 'currentColor'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>

            <button
              className="icon-btn"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Dynamic Category Filter Tabs */}
        <div style={{ padding: '0 20px', marginTop: 10, display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {availableCategories.map((cat) => (
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
        {course.files.length > 3 && (
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
          {filteredFiles.length === 0 ? (
            <div className="fac-empty-state" style={{ padding: '24px 16px' }}>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
                No materials found in this category.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredFiles.map((file) => {
                const viewUrl = `/api/papers?path=${encodeURIComponent(file.path)}&source=${activeCampus}`;
                const downloadUrl = `/api/papers?path=${encodeURIComponent(file.path)}&source=${activeCampus}&download=true`;

                const catClass = file.category ? `mat-badge-${file.category}` : 'mat-badge-additional';
                const badgeText = file.badge || file.categoryLabel || 'Material';

                return (
                  <div
                    key={file.path}
                    className="paper-file-row"
                    style={{
                      borderRadius: 10,
                      border: '1px solid var(--line)',
                      padding: '10px 14px',
                      background: 'var(--surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
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
                        style={{
                          textDecoration: 'none',
                          padding: '5px 10px',
                          borderRadius: 'var(--r-m)',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--indigo)',
                          background: 'rgba(79, 70, 229, 0.08)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
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
                        style={{
                          textDecoration: 'none',
                          padding: '5px 9px',
                          borderRadius: 'var(--r-m)',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--ink-2)',
                          background: 'var(--raised)',
                          border: '1px solid var(--line)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
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
  );
}

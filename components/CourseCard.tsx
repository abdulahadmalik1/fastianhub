'use client';

import { CourseGroup, getCourseDescription } from '@/lib/papers';

interface CourseCardProps {
  group: CourseGroup;
  isBookmarked: boolean;
  onSelect: (group: CourseGroup) => void;
  onToggleBookmark: (courseName: string) => void;
}

export default function CourseCard({
  group,
  isBookmarked,
  onSelect,
  onToggleBookmark,
}: CourseCardProps) {
  const desc = getCourseDescription(group.course);

  return (
    <article
      className="ff-paper-card"
      onClick={() => onSelect(group)}
      role="button"
      tabIndex={0}
      aria-label={group.course}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(group);
        }
      }}
    >
      {/* Card Header: Course Title & Star Bookmark Button */}
      <div className="ff-card-top-row">
        <h2 className="ff-card-title">{group.course}</h2>
        <button
          type="button"
          className={`ff-star-btn ${isBookmarked ? 'starred' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(group.course);
          }}
          aria-label={isBookmarked ? `Unstar ${group.course}` : `Star ${group.course}`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark this course'}
          id={`star-btn-${group.course.replace(/\s+/g, '-').toLowerCase()}`}
        >
          <svg
            width="16"
            height="16"
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
      </div>

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
}

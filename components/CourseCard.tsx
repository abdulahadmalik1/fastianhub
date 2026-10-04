'use client';
import { CourseGroup } from '@/lib/papers';
import Icon from './Icon';
export default function CourseCard({ course, isBookmarked, onOpen, onToggleBookmark }: {
  course: CourseGroup; isBookmarked: boolean; onOpen: (course: CourseGroup) => void; onToggleBookmark: (courseName: string) => void;
}) {
  return <article className="course-card">
    <div className="course-card-meta"><span className="course-icon"><Icon name="book" size={19} /></span><span>{course.semesterLabel}</span></div>
    <h3><button className="course-open" onClick={() => onOpen(course)}>{course.course}<span className="sr-only"> — browse papers</span></button></h3>
    <div className="course-card-bottom">
      <button className={`save-button${isBookmarked ? ' is-saved' : ''}`} aria-pressed={isBookmarked} aria-label={`${isBookmarked ? 'Unsave' : 'Save'} ${course.course}`} onClick={() => onToggleBookmark(course.course)}><Icon name="bookmark" size={16} filled={isBookmarked} />{isBookmarked ? 'Saved' : 'Save'}</button>
      <span className="card-arrow"><Icon name="arrow" size={20} /></span>
    </div>
  </article>;
}

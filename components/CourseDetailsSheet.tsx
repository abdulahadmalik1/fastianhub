'use client';
import { useState } from 'react';
import { CourseGroup, CampusId, formatBytes } from '@/lib/papers';
import Icon from './Icon';
import Modal from './Modal';
const categoryNames: Record<string, string> = { final: 'Finals', sessional: 'Mids / Sessionals', quiz: 'Quizzes', assignment: 'Assignments', lab: 'Labs & Tasks', project: 'Projects', outline: 'Outlines', book_notes: 'Notes & Books', additional: 'Other resources' };
export default function CourseDetailsSheet({ course, campusShortName, activeCampus, isBookmarked, onClose, onToggleBookmark }: {
  course: CourseGroup; campusShortName: string; activeCampus: CampusId; isBookmarked: boolean; onClose: () => void; onToggleBookmark: (name: string) => void;
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(40);
  const [copied, setCopied] = useState(false);
  const handleShare = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const categories = Object.entries(categoryNames).filter(([key]) => course.files.some(file => (file.category || 'additional') === key));
  const files = course.files.filter(file => (filter === 'all' || (file.category || 'additional') === filter) && `${file.title} ${file.fileName} ${file.badge || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <Modal labelledBy="course-title" onClose={onClose} className="course-dialog">
    <header className="sheet-header"><div><p className="eyebrow">{campusShortName} · {course.semesterLabel}</p><h2 id="course-title">{course.course}</h2></div><button className="close-button" onClick={onClose} autoFocus><Icon name="close" size={18} /><span>Close</span></button></header>
    <div className="sheet-summary"><p>{course.fileCount} files to help you prepare</p><div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><button className="save-button" onClick={handleShare} aria-label="Copy link to this course"><Icon name={copied ? 'check' : 'external'} size={15} />{copied ? 'Link copied!' : 'Share'}</button><button className={`save-button${isBookmarked ? ' is-saved' : ''}`} aria-pressed={isBookmarked} onClick={() => onToggleBookmark(course.course)}><Icon name="bookmark" size={17} filled={isBookmarked} />{isBookmarked ? 'Saved' : 'Save course'}</button></div></div>
    <div className="sheet-controls"><div className="search-wrap"><Icon name="search" size={19} /><input type="search" className="search-input" aria-label="Search files in this course" placeholder="Search papers…" value={search} onChange={event => { setSearch(event.target.value); setLimit(40); }} />{search && <button className="icon-btn" aria-label="Clear paper search" onClick={() => setSearch('')}><Icon name="close" size={16} /></button>}</div><label className="select-field"><span>Paper type</span><select aria-label="Paper type" value={filter} onChange={event => { setFilter(event.target.value); setLimit(40); }}><option value="all">All types</option>{categories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
    <div className="sheet-body"><p className="sheet-result-count" role="status">{files.length} {files.length === 1 ? 'file' : 'files'}{filter !== 'all' ? ` · ${categoryNames[filter]}` : ''}</p>{files.length ? <div className="paper-list">{files.slice(0, limit).map(file => {
      const url = `/api/papers?path=${encodeURIComponent(file.path)}&source=${activeCampus}`;
      return <article key={file.path} className="paper-row"><span className="paper-icon"><Icon name="file" size={23} /></span><div className="paper-info"><h3>{file.title || file.fileName}</h3><div className="paper-meta"><span>{file.badge || file.categoryLabel || 'Resource'}</span>{file.isSolution && <span className="solution-label"><Icon name="check" size={13} />Solution</span>}<span>{file.fileType.toUpperCase()}{file.size ? ` · ${formatBytes(file.size)}` : ''}</span></div></div><div className="paper-actions"><a href={url} target="_blank" rel="noopener noreferrer" className="paper-view" aria-label={`Open ${file.title || file.fileName} in a new tab`}>Open <Icon name="external" size={15} /></a><a href={`${url}&download=true`} download className="paper-download" aria-label={`Download ${file.title || file.fileName}`}><Icon name="download" size={16} /><span>Download</span></a></div></article>;
    })}{files.length > limit && <button className="secondary-button" onClick={() => setLimit(count => count + 40)}>Show more files</button>}</div> : <div className="empty-state"><Icon name="search" size={28} /><h3>No papers match just yet.</h3><p>Try another search or paper type.</p><button className="secondary-button" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</button></div>}</div>
    <footer className="sheet-footer"><span>Shared by students. Good luck with your prep.</span><button className="text-button" onClick={onClose}>Back to courses <Icon name="arrow" size={17} /></button></footer>
  </Modal>;
}

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import pastPapersData from '@/data/pastPapers.json';
import SubmitRepoModal from './SubmitRepoModal';
import FeedbackModal from './FeedbackModal';
import CourseCard from './CourseCard';
import CourseDetailsSheet from './CourseDetailsSheet';
import Icon from './Icon';
import { CampusId, CourseGroup, CampusMetadata, PaperFile } from '@/lib/papers';
import { campusOptions, type SupportedCampusId } from '@/lib/campuses';

const campuses = pastPapersData.campuses as unknown as Record<CampusId, CampusMetadata>;
const cleanFiles = (files: PaperFile[]) => files.filter(file => !/^readme/i.test(file.fileName) && !/\.md$/i.test(file.fileName) && file.fileName !== '.gitkeep');

export default function PastPapersView({ initialCampus }: { initialCampus?: SupportedCampusId }) {
  const [activeCampus, setActiveCampus] = useState<CampusId>(initialCampus || 'islamabad');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'browse' | 'saved'>('browse');
  const [selectedCourse, setSelectedCourse] = useState<CourseGroup | null>(null);
  const [modal, setModal] = useState<'contribute' | 'feedback' | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [announcement, setAnnouncement] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Restore optional browser preferences after hydration.
    let frame: number | undefined;
    try {
      const campus = localStorage.getItem('fastianhub_past_papers_campus') || localStorage.getItem('fastiflex_past_papers_campus');
      const savedCampus = campus === 'central' ? 'lahore' : campus;
      const savedBookmarks = JSON.parse(localStorage.getItem('fastianhub_bookmarked_courses') || localStorage.getItem('fastiflex_bookmarked_courses') || '[]');
      frame = requestAnimationFrame(() => {
        // A search landing URL opens its campus; the homepage keeps restoring preferences.
        if (!initialCampus && campusOptions.some(option => option.id === savedCampus)) setActiveCampus(savedCampus as CampusId);
        if (Array.isArray(savedBookmarks)) setBookmarks(savedBookmarks.filter(value => typeof value === 'string'));
      });
    } catch { /* Browsing remains available without local storage. */ }
    return () => { if (frame !== undefined) cancelAnimationFrame(frame); };
  }, [initialCampus]);

  const allCourses = useMemo(() => {
    const campus = campuses[activeCampus];
    const courses: CourseGroup[] = [];
    for (const semester of campus.semesters) {
      for (const course of semester.courses) {
        const files = cleanFiles(course.files);
        if (files.length) courses.push({ course: course.course, semesterLabel: `Semester ${semester.semester}`, semesterNum: semester.semester, fileCount: files.length, files, campus: activeCampus });
      }
    }
    for (const group of campus.outlines || []) {
      for (const course of group.courses) {
        const files = cleanFiles(course.files);
        if (files.length) courses.push({ course: `${course.course} (${group.group})`, semesterLabel: `Outlines · ${group.group}`, semesterNum: 'outlines', fileCount: files.length, files, campus: activeCampus });
      }
    }
    return courses;
  }, [activeCampus]);
  const isSaved = (name: string) => bookmarks.includes(name) || bookmarks.includes(`${activeCampus}:${name}`);
  const savedCount = allCourses.filter(course => isSaved(course.course)).length;
  const filteredCourses = allCourses.filter(course => {
    if (view === 'saved' && !isSaved(course.course)) return false;
    if (selectedFilter !== 'all' && String(course.semesterNum) !== selectedFilter) return false;
    const query = searchQuery.trim().toLowerCase();
    const acronym = course.course.replace(/\([^)]*\)/g, '').split(/\s+/).filter(word => !['and', 'of', '&'].includes(word.toLowerCase())).map(word => word[0]).join('').toLowerCase();
    return !query || course.course.toLowerCase().includes(query) || acronym === query || course.files.some(file => `${file.title} ${file.fileName}`.toLowerCase().includes(query));
  });
  const semesterOptions = [{ value: 'all', label: 'All semesters' }, ...Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` })), ...(allCourses.some(course => course.semesterNum === 'outlines') ? [{ value: 'outlines', label: 'Outlines' }] : [])];
  const toggleBookmark = (name: string) => {
    const alreadySaved = isSaved(name);
    const next = alreadySaved ? bookmarks.filter(value => value !== name && value !== `${activeCampus}:${name}`) : [...bookmarks, `${activeCampus}:${name}`];
    setBookmarks(next);
    setAnnouncement(`${name} ${alreadySaved ? 'removed from saved courses' : 'saved'}.`);
    try { localStorage.setItem('fastianhub_bookmarked_courses', JSON.stringify(next)); } catch { /* Keep this session's bookmarks. */ }
  };
  const switchView = (next: 'browse' | 'saved') => {
    setView(next); setSearchQuery(''); setSelectedFilter('all'); setVisibleCount(12);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const resetFilters = () => { setSearchQuery(''); setSelectedFilter('all'); setVisibleCount(12); };
  const navigation = <>
    <button className={view === 'browse' ? 'nav-item active' : 'nav-item'} aria-current={view === 'browse' ? 'page' : undefined} onClick={() => switchView('browse')}><Icon name="book" size={19} />Past papers</button>
    <button className={view === 'saved' ? 'nav-item active' : 'nav-item'} aria-current={view === 'saved' ? 'page' : undefined} onClick={() => switchView('saved')}><Icon name="bookmark" size={18} />Saved courses{savedCount > 0 && <span className="nav-count">{savedCount}</span>}</button>
  </>;

  return <div className="app-shell">
    <a className="skip-link" href="#browse">Skip to courses</a>
    <header className="site-header"><div className="container header-inner">
      <Link href="/" className="brand" aria-label="FastianHub home"><span className="brand-mark"><Icon name="book" size={22} /></span><span>Fastian<span className="brand-light">Hub</span><small>THE STUDENT ARCHIVE</small></span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">{navigation}</nav>
      <span className="header-note">A little help for your next exam.</span>
    </div></header>
    <main className="container" id="browse">
      <section className="hero" aria-labelledby="page-title">
        <div><p className="eyebrow"><span /> BY FASTIANS, FOR FASTIANS</p><h1 id="page-title">{view === 'saved' ? <>Your courses.<br /><em>Right here.</em></> : <>Less searching.<br /><em>More studying.</em></>}</h1></div>
        <div className="hero-aside"><p>{view === 'saved' ? 'The courses you’ve saved, ready for your next study session.' : 'Past papers, a little less panic.'}</p><p>{view === 'saved' ? 'Saved on this device. No sign-up needed.' : 'Find your course. Pick a paper. You’ve got this.'}</p><span className="archive-note"><Icon name="book" size={16} /> The FAST NUCES past-paper collection</span></div>
      </section>
      <section className="browse-controls" aria-label="Find courses">
        <div className="search-filter-row">
          <div className="search-wrap"><Icon name="search" size={22} /><input ref={searchRef} id="past-papers-search-input" type="search" className="search-input" value={searchQuery} onChange={event => { setSearchQuery(event.target.value); setVisibleCount(12); }} placeholder="Search a course or paper…" aria-label="Search courses and papers" />{searchQuery && <button className="icon-btn" onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }} aria-label="Clear search"><Icon name="close" size={18} /></button>}</div>
          <div className="select-filters">
            <label className="select-field campus-field"><span>Campus</span><select aria-label="Campus" value={activeCampus} onChange={event => { const campus = event.target.value as CampusId; setActiveCampus(campus); resetFilters(); try { localStorage.setItem('fastianhub_past_papers_campus', campus); } catch { /* Campus changes still work. */ } }}>{campusOptions.map(campus => <option value={campus.id} key={campus.id}>{campus.name}</option>)}</select></label>
            <label className="select-field mobile-semester"><span>Semester</span><select aria-label="Semester" value={selectedFilter} onChange={event => { setSelectedFilter(event.target.value); setVisibleCount(12); }}>{semesterOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          </div>
        </div>
        <div className="semester-filters" role="group" aria-label="Semester filter"><span className="filter-label">Semester</span>{semesterOptions.map(option => <button key={option.value} className={`filter-chip${selectedFilter === option.value ? ' active' : ''}`} aria-pressed={selectedFilter === option.value} onClick={() => { setSelectedFilter(option.value); setVisibleCount(12); }}>{option.value === 'all' ? 'All' : option.label.replace('Semester', 'Sem')}</button>)}</div>
      </section>
      <section className="courses-section" aria-labelledby="courses-title">
        <div className="section-heading"><div><h2 id="courses-title">{view === 'saved' ? 'Saved courses' : selectedFilter === 'all' ? 'Explore courses' : selectedFilter === 'outlines' ? 'Course outlines' : `Semester ${selectedFilter}`} <span className="result-count">{filteredCourses.length}</span></h2><p aria-live="polite">{searchQuery ? `Results for “${searchQuery}”` : view === 'saved' ? 'A shortcut to the courses you come back to.' : 'A head start for whatever’s next.'}</p></div>{(searchQuery || selectedFilter !== 'all') ? <button className="text-button" onClick={resetFilters}>Clear filters</button> : <span className="campus-caption"><Icon name="pin" size={15} />{campusOptions.find(campus => campus.id === activeCampus)?.name}</span>}</div>
        {filteredCourses.length ? <><div className="course-grid">{filteredCourses.slice(0, visibleCount).map(course => <CourseCard key={`${course.semesterNum}:${course.course}`} course={course} isBookmarked={isSaved(course.course)} onOpen={setSelectedCourse} onToggleBookmark={toggleBookmark} />)}</div><div className="load-more"><p>Showing {Math.min(visibleCount, filteredCourses.length)} of {filteredCourses.length} courses</p>{visibleCount < filteredCourses.length && <button className="secondary-button" onClick={() => setVisibleCount(count => count + 12)}>Show more courses <Icon name="arrow" size={17} /></button>}</div></> : <div className="empty-state"><span className="empty-icon"><Icon name={view === 'saved' ? 'bookmark' : 'search'} size={28} /></span><h3>{view === 'saved' && !savedCount ? 'Keep your courses close.' : 'No courses found.'}</h3><p>{view === 'saved' && !savedCount ? 'Tap Save on a course to find it here next time.' : 'Try another course name, semester, or campus.'}</p><button className="primary-button" onClick={() => { resetFilters(); if (view === 'saved') setView('browse'); }}>{view === 'saved' ? 'Browse courses' : 'Clear filters'}</button></div>}
      </section>
      <aside className="community-note"><span className="community-icon"><Icon name="heart" size={22} /></span><div><h2>Good notes deserve good company.</h2><p>Have a past-paper collection? Help the next Fastian out.</p></div><button className="text-button" onClick={() => setModal('contribute')}>Contribute papers <Icon name="arrow" size={18} /></button></aside>
    </main>
    <footer className="container site-footer"><p>Made for the days before the exam.</p><nav aria-label="Community links"><Link href="/credits">Credits</Link><button onClick={() => setModal('feedback')}>Feedback</button><a href="#browse">Back to top ↑</a></nav></footer>
    <nav className="mobile-nav" aria-label="Main navigation">{navigation}</nav>
    <span className="sr-only" role="status">{announcement}</span>
    {selectedCourse && <CourseDetailsSheet key={`${selectedCourse.campus}:${selectedCourse.course}`} course={selectedCourse} campusShortName={campusOptions.find(campus => campus.id === activeCampus)?.name || activeCampus} activeCampus={activeCampus} isBookmarked={isSaved(selectedCourse.course)} onClose={() => setSelectedCourse(null)} onToggleBookmark={toggleBookmark} />}
    {modal === 'contribute' && <SubmitRepoModal isOpen onClose={() => setModal(null)} />}
    {modal === 'feedback' && <FeedbackModal isOpen onClose={() => setModal(null)} />}
  </div>;
}

'use client';

import { useMemo, useState } from 'react';
import pastPapersData from '@/data/pastPapers.json';
import { buildDashboardCatalog, collectMaterials, filterMaterials, groupDashboardCourses, materialTypes } from '@/lib/dashboard-data';
import type { CampusMetadata } from '@/lib/papers';
import DashboardCoursePicker from './DashboardCoursePicker';
import Icon from './Icon';

const catalog = buildDashboardCatalog(pastPapersData.campuses as unknown as Record<string, CampusMetadata>);
const emptyFilters = { course: 'all', type: 'all' };

export default function DashboardWorkspace({ selectedIds, onSave }: { selectedIds: string[]; onSave: (original: string[], draft: string[]) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [limit, setLimit] = useState(30);
  const [notice, setNotice] = useState('');
  const chosen = useMemo(() => catalog.filter(course => selectedIds.includes(course.id)), [selectedIds]);
  const subjects = useMemo(() => groupDashboardCourses(chosen), [chosen]);
  const materials = useMemo(() => collectMaterials(chosen), [chosen]);
  // A course removed on another device must not leave an invisible filter active.
  const effectiveFilters = { ...filters, course: subjects.some(course => course.id === filters.course) ? filters.course : 'all' };
  const filtered = filterMaterials(materials, { ...effectiveFilters, query: '', solutions: false });
  const changeFilter = (patch: Partial<typeof filters>) => { setFilters(value => ({ ...value, ...patch })); setLimit(30); };
  const reset = () => { setFilters(emptyFilters); setLimit(30); };

  return <div className="dashboard-workspace">
    <section className="dashboard-course-summary" aria-labelledby="my-courses-title">
      <div className="section-heading">
        <h2 id="my-courses-title">My courses <span className="dashboard-course-count">{subjects.length}</span></h2>
        {chosen.length > 0 && <button className="dashboard-edit-courses" onClick={() => setEditing(true)}>Edit courses</button>}
      </div>
      {subjects.length > 0 && <div className="dashboard-course-chips" role="group" aria-label="Filter materials by course">
        <button className={`dashboard-course-chip${effectiveFilters.course === 'all' ? ' active' : ''}`} aria-pressed={effectiveFilters.course === 'all'} onClick={() => changeFilter({ course: 'all' })}>All courses</button>
        {subjects.map(course => <button key={course.id} className={`dashboard-course-chip${effectiveFilters.course === course.id ? ' active' : ''}`} aria-pressed={effectiveFilters.course === course.id} onClick={() => changeFilter({ course: effectiveFilters.course === course.id ? 'all' : course.id })}>{course.name}</button>)}
      </div>}
      {selectedIds.length > chosen.length && <p className="dashboard-fine-print">Some saved courses are no longer in the archive. Manage your courses to update your list.</p>}
      {notice && <p className="dashboard-success" role="status">{notice}</p>}
    </section>
    {chosen.length ? <section className="dashboard-materials" aria-labelledby="my-materials-title">
      <div className="dashboard-materials-heading">
        <h2 id="my-materials-title">Study materials</h2>
        <div className="dashboard-filters">
          <label className="select-field"><span>Material type</span><select aria-label="Filter by material type" value={filters.type} onChange={event => changeFilter({ type: event.target.value })}><option value="all">All types</option>{Object.entries(materialTypes).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        </div>
      </div>
      {(effectiveFilters.course !== 'all' || filters.type !== 'all') && <div className="dashboard-clear-filters"><button className="text-button" onClick={reset}>Clear filters</button></div>}
      {filtered.length ? <><div className="dashboard-resource-list">{filtered.slice(0, limit).map(({ id, course, file }) => {
        const url = `/api/papers?path=${encodeURIComponent(file.path)}&source=${course.campus}`;
        return <article className="dashboard-resource" key={id}><span className="dashboard-resource-icon"><Icon name="file" size={19} /></span><div className="dashboard-resource-text"><h3>{file.title || file.fileName}</h3><p>{materialTypes[file.category || 'additional']} · {course.campusName}</p></div><div className="dashboard-resource-actions"><a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${file.title || file.fileName}`}>Open <Icon name="external" size={14} /></a><a href={`${url}&download=true`} title="Download" aria-label={`Download ${file.title || file.fileName}`}><Icon name="download" size={17} /></a></div></article>;
      })}</div>{filtered.length > limit && <div className="load-more"><button className="secondary-button" onClick={() => setLimit(value => value + 30)}>Show more <Icon name="arrow" size={17} /></button></div>}</> : <div className="empty-state"><Icon name="file" size={28} /><h3>No materials found.</h3><p>Choose another material type or clear your filters.</p></div>}
    </section> : <section className="dashboard-empty"><span className="empty-icon"><Icon name="book" size={26} /></span><h2>Start with your courses.</h2><p>Add the courses you’re studying. Your papers, quizzes, and notes will appear here.</p><button className="primary-button" onClick={() => setEditing(true)}>Choose my courses <Icon name="arrow" size={17} /></button></section>}
    {editing && <DashboardCoursePicker catalog={catalog} selectedIds={selectedIds} onClose={() => setEditing(false)} onSave={async (original, draft) => { await onSave(original, draft); setNotice('Your course list has been saved.'); setEditing(false); }} />}
  </div>;
}

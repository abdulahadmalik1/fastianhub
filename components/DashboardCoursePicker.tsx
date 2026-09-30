'use client';

import { useState } from 'react';
import { campusOptions } from '@/lib/campuses';
import { MAX_DASHBOARD_COURSES, groupDashboardCourses, type DashboardCourse } from '@/lib/dashboard-data';
import { dashboardError } from '@/lib/dashboard-account';
import Icon from './Icon';
import Modal from './Modal';

export default function DashboardCoursePicker({ catalog, selectedIds, onClose, onSave }: {
  catalog: DashboardCourse[]; selectedIds: string[]; onClose: () => void;
  onSave: (original: string[], draft: string[]) => Promise<void>;
}) {
  const [original] = useState(() => [...selectedIds]);
  const [draft, setDraft] = useState(() => selectedIds.filter(id => catalog.some(course => course.id === id)));
  const [campus, setCampus] = useState('islamabad');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const courses = groupDashboardCourses(catalog.filter(course => campus === 'all' || course.campus === campus))
    .filter(group => `${group.name} ${group.courses.map(course => course.course).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selectedCount = groupDashboardCourses(catalog.filter(course => draft.includes(course.id))).length;
  const toggle = (ids: string[]) => {
    const allSelected = ids.every(id => draft.includes(id));
    const next = allSelected ? draft.filter(id => !ids.includes(id)) : [...new Set([...draft, ...ids])];
    if (next.length > MAX_DASHBOARD_COURSES) { setError('Your course list is full. Remove a course before adding another.'); return; }
    setError(''); setDraft(next);
  };
  const save = async () => {
    setBusy(true); setError('');
    try { await onSave(original, draft); } catch (error) { setError(dashboardError(error)); setBusy(false); }
  };
  return <Modal labelledBy="course-picker-title" onClose={onClose} className="course-dialog dashboard-picker" dismissible={!busy}>
    <header className="sheet-header"><div><h2 id="course-picker-title">Choose your courses</h2></div><button className="close-button" disabled={busy} onClick={onClose} aria-label="Close course picker"><Icon name="close" size={18} /></button></header>
    <div className="dashboard-picker-intro"><p>Select your courses, then save.</p></div>
    <div className="dashboard-picker-controls"><div className="search-wrap"><Icon name="search" size={19} /><input className="search-input" type="search" autoFocus aria-label="Find a course to add" placeholder="Find a course…" value={query} onChange={event => setQuery(event.target.value)} /></div><label className="select-field"><span>Campus</span><select aria-label="Choose campus" value={campus} onChange={event => setCampus(event.target.value)}><option value="all">All campuses</option>{campusOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label></div>
    <div className="sheet-body dashboard-picker-list" aria-busy={busy}><div key={`${campus}:${query}`} className="dashboard-picker-options">{courses.map(group => {
      const ids = group.courses.map(course => course.id);
      const checked = ids.every(id => draft.includes(id));
      const partial = !checked && ids.some(id => draft.includes(id));
      return <label key={group.id} className={`dashboard-course-option${checked || partial ? ' is-selected' : ''}`}><input type="checkbox" checked={checked} ref={input => { if (input) input.indeterminate = partial; }} disabled={busy} onChange={() => toggle(ids)} /><span><strong>{group.name}</strong></span></label>;
    })}{!courses.length && <div className="empty-state"><h3>No courses found.</h3><p>Try another course name or campus.</p></div>}</div></div>
    {error && <p className="dashboard-picker-error" role="alert">{error}</p>}
    <footer className="sheet-footer dashboard-picker-footer"><p role="status">{selectedCount} selected</p><div><button className="secondary-button" disabled={busy} onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy} onClick={() => void save()}>{busy ? <><span className="spinner-sm" aria-hidden="true" />Saving…</> : <>Save courses<Icon name="check" size={17} /></>}</button></div></footer>
  </Modal>;
}

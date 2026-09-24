'use client';
import { useState } from 'react';
import sectionsData from '@/lib/sectionsMetadata.json';

export default function SectionPicker({ initial = '', onSelect, action = 'Open my timetable' }: { initial?: string; onSelect: (section: string) => void; action?: string }) {
  const batches = sectionsData.batches;
  const initialBatch = batches.find(b => initial.startsWith(b.batch + '-')) ?? batches[0];
  const initialSection = initial.slice(initialBatch.batch.length + 1);
  const [batch, setBatch] = useState(initialBatch.batch);
  const [program, setProgram] = useState(initialBatch.programs.find(p => p.sections.includes(initialSection))?.program ?? initialBatch.programs[0].program);
  const [selected, setSelected] = useState(initial);
  const [search, setSearch] = useState('');
  const currentBatch = batches.find(b => b.batch === batch)!;
  const sections = currentBatch.programs.find(p => p.program === program)?.sections ?? [];
  const query = search.trim().toLowerCase();
  const results = query ? batches.flatMap(b => b.programs.flatMap(p => p.sections.map(section => ({ id: b.batch + '-' + section, section, batch: b.batch, program: p.program })))).filter(s => query.split(/\s+/).every(word => (s.batch + ' ' + s.program + ' ' + s.section).toLowerCase().includes(word))) : [];
  return <form className="section-picker" onSubmit={e => { e.preventDefault(); if (selected) onSelect(selected); }}>
    <label className="search-field"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input aria-label="Search sections" placeholder="Find your section, e.g. CS-A" value={search} onChange={e => setSearch(e.target.value)} />{search && <button type="button" className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">×</button>}</label>
    {query ? <div className="search-results"><p className="field-label" aria-live="polite">{results.length} matching sections</p><div className="result-grid">{results.map(s => <button type="button" className={'section-option result-option' + (selected === s.id ? ' selected' : '')} key={s.id} aria-pressed={selected === s.id} onClick={() => setSelected(s.id)}><strong>{s.section}</strong><span>{s.program} · {s.batch}</span></button>)}</div>{!results.length && <p className="picker-empty">No match yet. Try your batch year or section name.</p>}</div> : <>
      <div className="picker-selects"><label className="picker-field"><span className="field-label">01 / Batch</span><select value={batch} onChange={e => { const b = batches.find(b => b.batch === e.target.value)!; setBatch(b.batch); if (!b.programs.some(p => p.program === program)) setProgram(b.programs[0].program); setSelected(''); }}>{batches.map(b => <option key={b.batch} value={b.batch}>{b.label}</option>)}</select></label><label className="picker-field"><span className="field-label">02 / Program</span><select value={program} onChange={e => { setProgram(e.target.value); setSelected(''); }}>{currentBatch.programs.map(p => <option key={p.program}>{p.program}</option>)}</select></label></div>
      <fieldset className="section-fieldset"><legend className="field-label">03 / Your section</legend><div className="section-grid">{sections.map(s => { const id = batch + '-' + s; return <button type="button" key={s} aria-pressed={selected === id} className={'section-option' + (selected === id ? ' selected' : '')} onClick={() => setSelected(id)}>{s}</button>; })}</div></fieldset>
    </>}
    <div className="picker-confirm"><p aria-live="polite">{selected ? <><strong>{selected.slice(selected.indexOf('-') + 1)}</strong> · Batch {selected.split('-')[0]}</> : 'Pick your section to get started.'}</p><button className="btn-primary" id="confirm-section" disabled={!selected} type="submit">{action}<span aria-hidden="true">↗</span></button></div>
  </form>;
}

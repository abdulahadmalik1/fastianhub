'use client';
import { useState, useMemo } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import sectionsData from '@/lib/sectionsMetadata.json';

interface Props {
  onClose: () => void;
  onSectionChange?: (section: string) => void;
}

export default function SettingsModal({ onClose, onSectionChange }: Props) {
  const { sectionFilter } = useTimetable();
  const batches = sectionsData.batches;

  // Extract initial batch and section from sectionFilter (e.g. "2026-CS-A" or "CS-A")
  const initialBatch = useMemo(() => {
    if (sectionFilter.includes('-')) {
      const b = sectionFilter.split('-')[0];
      if (batches.some(item => item.batch === b)) return b;
    }
    return '2026';
  }, [sectionFilter, batches]);

  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(initialBatch);
  const [selectedDocId, setSelectedDocId] = useState(
    sectionFilter.startsWith('202') ? sectionFilter : `2026-${sectionFilter}`
  );

  const currentBatch = useMemo(() => {
    return batches.find(b => b.batch === selectedBatch) || batches[0];
  }, [batches, selectedBatch]);

  const currentPrograms = useMemo(() => {
    return currentBatch.programs || [];
  }, [currentBatch]);

  const [activeProgram, setActiveProgram] = useState(() => {
    const sec = sectionFilter.replace(/^\d+-/, '');
    const found = currentPrograms.find(p => p.sections.includes(sec));
    return found ? found.program : currentPrograms[0]?.program || 'BS CS';
  });

  const currentSections = useMemo(() => {
    const prog = currentPrograms.find(p => p.program === activeProgram);
    if (!prog) return currentPrograms[0]?.sections || [];
    return prog.sections;
  }, [currentPrograms, activeProgram]);

  // Search results
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];

    const results: Array<{
      docId: string;
      batch: string;
      batchLabel: string;
      color: string;
      program: string;
      section: string;
    }> = [];

    batches.forEach(b => {
      b.programs.forEach(p => {
        p.sections.forEach(sec => {
          const matchTarget = `${b.batch} ${b.label} ${p.program} ${sec}`.toLowerCase();
          if (matchTarget.includes(q)) {
            results.push({
              docId: `${b.batch}-${sec}`,
              batch: b.batch,
              batchLabel: b.label.split('(')[0].trim(),
              color: b.color,
              program: p.program,
              section: sec,
            });
          }
        });
      });
    });

    return results.slice(0, 16);
  }, [search, batches]);

  function apply() {
    if (!selectedDocId) return;
    onSectionChange?.(selectedDocId);
    onClose();
  }

  const selectedDisplay = useMemo(() => {
    if (!selectedDocId) return '';
    const [b, ...rest] = selectedDocId.split('-');
    const sec = rest.join('-');
    return `${sec} (${b})`;
  }, [selectedDocId]);

  return (
    <div
      className="modal-overlay"
      id="settings-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true" aria-label="Settings"
    >
      <div className="modal" style={{ maxWidth: 440, padding: 22 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Change Section & Batch</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
              Select your batch year to view corresponding timetable
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} id="close-settings" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ gap: 14 }}>
          {/* Quick Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              id="settings-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search batch or section (e.g. CS-A, 2026)..."
              style={{
                width: '100%',
                padding: '8px 12px',
                paddingLeft: '32px',
                borderRadius: 'var(--r-m)',
                border: '1px solid var(--line)',
                background: 'var(--raised)',
                fontSize: 12,
                color: 'var(--ink-1)',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
              style={{ position: 'absolute', left: 10, top: 10, color: 'var(--ink-3)' }}
            >
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 8, top: 8,
                  background: 'none', border: 'none', color: 'var(--ink-3)',
                  cursor: 'pointer', fontSize: 12
                }}
              >
                ✕
              </button>
            )}
          </div>

          {search.trim() ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>
                Results ({searchResults.length})
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 5,
                maxHeight: 200,
                overflowY: 'auto'
              }}>
                {searchResults.map(item => {
                  const isSelected = selectedDocId === item.docId;
                  return (
                    <button
                      key={item.docId}
                      onClick={() => setSelectedDocId(item.docId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 'var(--r-m)',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--ink-1)' : 'var(--line)',
                        background: isSelected ? 'var(--ink-1)' : 'var(--raised)',
                        color: isSelected ? '#fff' : 'var(--ink-1)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{item.section}</div>
                        <div style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--ink-3)' }}>
                          {item.batchLabel}
                        </div>
                      </div>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: item.color, flexShrink: 0
                      }} />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Batch Tabs */}
              <div>
                <p className="field-label">Batch (Semester)</p>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                  {batches.map(b => {
                    const isSelected = selectedBatch === b.batch;
                    return (
                      <button
                        key={b.batch}
                        onClick={() => {
                          setSelectedBatch(b.batch);
                          const nextPrograms = b.programs || [];
                          const hasProg = nextPrograms.some(p => p.program === activeProgram);
                          if (!hasProg && nextPrograms.length > 0) {
                            setActiveProgram(nextPrograms[0].program);
                          }
                        }}
                        style={{
                          padding: '5px 9px',
                          borderRadius: 'var(--r-m)',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--ink-1)' : 'var(--line)',
                          background: isSelected ? 'var(--ink-1)' : 'var(--raised)',
                          color: isSelected ? '#fff' : 'var(--ink-2)',
                          fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 4,
                          transition: 'all 0.1s',
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: b.color }} />
                        {b.batch}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Program filter tabs */}
              {currentPrograms.length > 1 && (
                <div>
                  <p className="field-label">Program</p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {currentPrograms.map(p => {
                      const isSelected = activeProgram === p.program;
                      return (
                        <button
                          key={p.program}
                          onClick={() => setActiveProgram(p.program)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--r-m)',
                            border: '1px solid',
                            borderColor: isSelected ? 'var(--indigo)' : 'var(--line)',
                            background: isSelected ? '#eef2ff' : 'var(--raised)',
                            color: isSelected ? 'var(--indigo)' : 'var(--ink-2)',
                            fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.1s',
                          }}
                        >
                          {p.program}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section grid */}
              <div>
                <p className="field-label">Section</p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 5,
                  marginTop: 4,
                  maxHeight: 160,
                  overflowY: 'auto'
                }}>
                  {currentSections.map(sec => {
                    const docId = `${selectedBatch}-${sec}`;
                    const isSelected = selectedDocId === docId;
                    return (
                      <button
                        key={sec}
                        id={`settings-sec-${sec.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                        onClick={() => setSelectedDocId(docId)}
                        style={{
                          padding: '8px 3px',
                          borderRadius: 'var(--r-m)',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--ink-1)' : 'var(--line)',
                          background: isSelected ? 'var(--ink-1)' : 'var(--surface)',
                          color: isSelected ? '#fff' : 'var(--ink-2)',
                          fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all 0.1s',
                        }}
                      >
                        {sec}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <button
            className="btn-primary"
            id="apply-settings"
            onClick={apply}
            disabled={!selectedDocId}
            style={{ marginTop: 6 }}
          >
            {selectedDocId ? `Switch to ${selectedDisplay}` : 'Select a section'}
          </button>
        </div>
      </div>
    </div>
  );
}

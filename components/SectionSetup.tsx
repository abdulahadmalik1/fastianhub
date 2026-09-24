'use client';
import { useState, useMemo } from 'react';
import sectionsData from '@/lib/sectionsMetadata.json';

interface Props {
  onDone: (section: string) => void;
}

export default function SectionSetup({ onDone }: Props) {
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('2026');
  const [activeProgram, setActiveProgram] = useState('BS CS');
  const [selectedDocId, setSelectedDocId] = useState('');

  const batches = sectionsData.batches;

  // Active batch data
  const currentBatch = useMemo(() => {
    return batches.find(b => b.batch === selectedBatch) || batches[0];
  }, [batches, selectedBatch]);

  // Available programs in active batch
  const currentPrograms = useMemo(() => {
    return currentBatch.programs || [];
  }, [currentBatch]);

  // Available sections in active batch + active program
  const currentSections = useMemo(() => {
    const prog = currentPrograms.find(p => p.program === activeProgram);
    if (!prog) return currentPrograms[0]?.sections || [];
    return prog.sections;
  }, [currentPrograms, activeProgram]);

  // Search results across ALL batches
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

  function handleSelect(batch: string, section: string) {
    const docId = `${batch}-${section}`;
    setSelectedDocId(docId);
  }

  function handleSubmit() {
    if (!selectedDocId) return;
    localStorage.setItem('fastiflex_section', selectedDocId);
    onDone(selectedDocId);
  }

  // Display label for confirmation button
  const selectedDisplay = useMemo(() => {
    if (!selectedDocId) return '';
    const [b, ...rest] = selectedDocId.split('-');
    const sec = rest.join('-');
    return `${sec} (${b})`;
  }, [selectedDocId]);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'var(--page)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.6px', color: 'var(--ink-1)' }}>
            FastiFlex
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
            FAST NUCES Islamabad · Live Timetable
          </div>
        </div>

        {/* Card container */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 20,
          padding: '24px 20px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        }}>
          {/* Heading */}
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 4, color: 'var(--ink-1)' }}>
            Select Your Section
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 18 }}>
            Choose your batch & section to view your live schedule.
          </p>

          {/* Quick Search Bar */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              type="text"
              id="section-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by section or batch (e.g. CS-A, 2026, SE-B)..."
              style={{
                width: '100%',
                padding: '10px 14px',
                paddingLeft: '36px',
                borderRadius: 'var(--r-m)',
                border: '1px solid var(--line)',
                background: 'var(--raised)',
                fontSize: 13,
                color: 'var(--ink-1)',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
            />
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
              style={{ position: 'absolute', left: 12, top: 12, color: 'var(--ink-3)' }}
            >
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 10, top: 10,
                  background: 'none', border: 'none', color: 'var(--ink-3)',
                  cursor: 'pointer', fontSize: 13, padding: 2
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* If searching, show direct search results */}
          {search.trim() ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 8 }}>
                Search Results ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'var(--ink-3)' }}>
                  No sections found matching "{search}"
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 6,
                  maxHeight: 240,
                  overflowY: 'auto',
                  paddingRight: 2
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
                          padding: '10px 12px',
                          borderRadius: 'var(--r-m)',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--ink-1)' : 'var(--line)',
                          background: isSelected ? 'var(--ink-1)' : 'var(--raised)',
                          color: isSelected ? '#fff' : 'var(--ink-1)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          textAlign: 'left',
                          transition: 'all 0.1s',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>
                            {item.section}
                          </div>
                          <div style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--ink-3)' }}>
                            {item.batchLabel}
                          </div>
                        </div>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: item.color, flexShrink: 0
                        }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Otherwise, show standard Batch + Program + Section tabs */
            <>
              {/* Batch Tabs */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Select Batch (Semester)
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {batches.map(b => {
                    const isSelected = selectedBatch === b.batch;
                    return (
                      <button
                        key={b.batch}
                        id={`batch-tab-${b.batch.toLowerCase()}`}
                        onClick={() => {
                          setSelectedBatch(b.batch);
                          const nextPrograms = b.programs || [];
                          const hasProg = nextPrograms.some(p => p.program === activeProgram);
                          if (!hasProg && nextPrograms.length > 0) {
                            setActiveProgram(nextPrograms[0].program);
                          }
                          setSelectedDocId('');
                        }}
                        style={{
                          flex: '1 1 auto',
                          minWidth: '70px',
                          padding: '7px 10px',
                          borderRadius: 'var(--r-m)',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--ink-1)' : 'var(--line)',
                          background: isSelected ? 'var(--ink-1)' : 'var(--raised)',
                          color: isSelected ? '#fff' : 'var(--ink-2)',
                          fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          transition: 'all 0.12s',
                        }}
                      >
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: b.color, flexShrink: 0
                        }} />
                        {b.batch}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Program Tabs */}
              {currentPrograms.length > 1 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Program
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {currentPrograms.map(p => {
                      const isSelected = activeProgram === p.program;
                      return (
                        <button
                          key={p.program}
                          id={`prog-tab-${p.program.replace(/\s+/g, '').toLowerCase()}`}
                          onClick={() => {
                            setActiveProgram(p.program);
                            setSelectedDocId('');
                          }}
                          style={{
                            padding: '5px 11px',
                            borderRadius: 'var(--r-m)',
                            border: '1px solid',
                            borderColor: isSelected ? 'var(--indigo)' : 'var(--line)',
                            background: isSelected ? '#eef2ff' : 'var(--raised)',
                            color: isSelected ? 'var(--indigo)' : 'var(--ink-2)',
                            fontSize: 12, fontWeight: 600,
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

              {/* Section Grid */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Section
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 6,
                  maxHeight: 180,
                  overflowY: 'auto',
                  paddingRight: 2
                }}>
                  {currentSections.map(sec => {
                    const isSelected = selectedDocId === `${selectedBatch}-${sec}`;
                    return (
                      <button
                        key={sec}
                        id={`section-${sec.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                        onClick={() => handleSelect(selectedBatch, sec)}
                        style={{
                          padding: '9px 4px',
                          borderRadius: 'var(--r-m)',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--ink-1)' : 'var(--line)',
                          background: isSelected ? 'var(--ink-1)' : 'var(--surface)',
                          color: isSelected ? '#fff' : 'var(--ink-2)',
                          fontSize: 12, fontWeight: 600,
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

          {/* Confirm Button */}
          <button
            id="confirm-section"
            onClick={handleSubmit}
            disabled={!selectedDocId}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 'var(--r-m)',
              border: 'none',
              background: selectedDocId ? 'var(--ink-1)' : 'var(--raised)',
              color: selectedDocId ? '#fff' : 'var(--ink-3)',
              fontSize: 14, fontWeight: 700,
              cursor: selectedDocId ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {selectedDocId ? `Continue with ${selectedDisplay} →` : 'Select a section to continue'}
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', marginTop: 14 }}>
          You can change your batch and section anytime from settings.
        </p>
      </div>
    </div>
  );
}

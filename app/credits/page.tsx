'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import rawContributors from '@/data/contributors.json';
import pastPapersData from '@/data/pastPapers.json';
import SubmitRepoModal from '@/components/SubmitRepoModal';
import FeedbackModal from '@/components/FeedbackModal';

interface CreditEntry {
  id: string;
  name: string;
  profileUrl?: string;
  sourceUrl: string;
  paperCount: number;
  campusId?: string;
  verified: boolean;
}

export default function CreditsPage() {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Sync real paper counts and sort descending by paperCount
  const sortedCredits = useMemo(() => {
    const papers = pastPapersData as any;
    const campuses = papers?.campuses || {};

    const list: CreditEntry[] = (rawContributors as CreditEntry[])
      .filter((c) => c.verified !== false)
      .map((c) => {
        let liveCount = c.paperCount;
        if (c.campusId && campuses[c.campusId]?.totalFiles) {
          liveCount = campuses[c.campusId].totalFiles;
        }
        return {
          ...c,
          paperCount: liveCount
        };
      });

    list.sort((a, b) => b.paperCount - a.paperCount);
    return list;
  }, []);

  return (
    <div className="app-shell" style={{ paddingBottom: 40 }}>
      {/* Topbar */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'inherit'
            }}
            id="credits-back-home"
            title="Back to Past Papers"
          >
            <div>
              <h1 className="topbar-title">FastianHub Credits</h1>
              <p className="topbar-sub">Archive Leaderboard</p>
            </div>
          </Link>
        </div>

        <div className="topbar-actions">
          <Link
            href="/"
            className="topbar-feedback-btn"
            id="back-to-papers-btn"
            title="Browse all past papers"
            style={{ textDecoration: 'none' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Papers</span>
          </Link>

          <button
            className="submit-repo-toggle"
            onClick={() => setIsSubmitModalOpen(true)}
            id="open-submit-repo-btn"
            title="Contribute a repository"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Contribute</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 860, margin: '28px auto 0', padding: '0 20px', width: '100%' }}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-1)', margin: 0, letterSpacing: -0.4 }}>
            Credits
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '4px 0 0' }}>
            Contributors ranked by indexed papers.
          </p>
        </div>

        {/* Leaderboard Table */}
        {sortedCredits.length === 0 ? (
          <div className="fac-empty-state">
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '8px 0 4px', color: 'var(--ink-1)' }}>
              No credits yet
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
              Be the first to contribute an archive.
            </p>
            <button
              className="fac-reset-btn"
              onClick={() => setIsSubmitModalOpen(true)}
              style={{ marginTop: 14 }}
            >
              + Submit Repository
            </button>
          </div>
        ) : (
          <div className="lb-table-wrapper">
            <table className="lb-table">
              <thead>
                <tr>
                  <th className="lb-th lb-th-rank">#</th>
                  <th className="lb-th lb-th-url">URL</th>
                  <th className="lb-th lb-th-papers">Papers</th>
                </tr>
              </thead>
              <tbody>
                {sortedCredits.map((c, index) => {
                  const rank = index + 1;
                  return (
                    <tr key={c.id} className="lb-tr">
                      <td className="lb-td lb-td-rank">
                        <span className={`lb-rank-badge rank-${rank <= 3 ? rank : 'other'}`}>
                          {rank}
                        </span>
                      </td>

                      <td className="lb-td lb-td-url">
                        <span className="lb-url-text">
                          {c.sourceUrl.replace(/^https?:\/\//, '')}
                        </span>
                      </td>

                      <td className="lb-td lb-td-papers">
                        <span className="lb-papers-val">
                          {c.paperCount.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modals */}
      <SubmitRepoModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
      />
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
}

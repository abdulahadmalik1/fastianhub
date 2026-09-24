import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* ─── Navigation Header ────────────────────────────────────────── */}
      <header className="landing-header">
        <div className="landing-nav-container">
          <Link href="/" className="landing-logo">
            <span className="landing-logo-accent">Fasti</span>Flex
          </Link>

          <nav className="landing-nav-links">
            <Link href="/pastpapers" className="landing-nav-item">Past Papers</Link>
            <Link href="/timetable" className="landing-nav-item">Timetable</Link>
            <Link href="/findroom" className="landing-nav-item">Find Room</Link>
          </nav>

          <div className="landing-header-cta">
            <Link href="/timetable" className="landing-btn-sm">
              Open App
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-badge">
          <span className="landing-pulse-dot" />
          <span>FAST-NUCES Islamabad · Fall 2026</span>
        </div>

        <h1 className="landing-hero-title">
          The all-in-one student platform for FAST.
        </h1>

        <p className="landing-hero-subtitle">
          Everything you need for campus life in one blisteringly fast interface.
          Verified past papers, live synchronized timetable, and real-time room vacancy tracker.
        </p>

        <div className="landing-hero-actions">
          <Link href="/timetable" className="landing-btn-primary">
            <span>Launch Timetable</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>

          <Link href="/pastpapers" className="landing-btn-secondary">
            <span>Browse Past Papers</span>
          </Link>
        </div>
      </section>

      {/* ─── Features Container ──────────────────────────────────────── */}
      <div className="landing-features-container">

        {/* ─── 1. PAST PAPERS ─────────────────────────────────────────── */}
        <section className="landing-feature-card">
          <div className="landing-feature-content">
            <span className="landing-feature-tag">01 · Academic Archive</span>
            <h2 className="landing-feature-heading">
              500+ Past Papers & Course Outlines
            </h2>
            <p className="landing-feature-text">
              Fully indexed archive across Semesters 1 through 8. Find midterms, sessionals,
              quizzes, terminal finals, and official course outlines with direct 1-click downloads.
            </p>

            <ul className="landing-feature-list">
              <li>
                <span className="landing-check-icon">✓</span>
                <span>Organized semester-by-semester across CS, SE, AI, DS & CY</span>
              </li>
              <li>
                <span className="landing-check-icon">✓</span>
                <span>Instant in-browser document viewing without downloading</span>
              </li>
              <li>
                <span className="landing-check-icon">✓</span>
                <span>Zero rate limits — statically bundled for instant 0ms loads</span>
              </li>
            </ul>

            <Link href="/pastpapers" className="landing-feature-link">
              <span>Explore Past Papers</span>
              <span className="landing-arrow">→</span>
            </Link>
          </div>

          <div className="landing-preview-box">
            <div className="landing-mini-paper-grid">
              <div className="landing-mini-card">
                <span className="landing-mini-tag">Semester 1</span>
                <p className="landing-mini-title">Applied Physics (AP)</p>
                <p className="landing-mini-desc">Past finals, midterms & sessional papers</p>
                <div className="landing-mini-badge-row">
                  <span className="landing-chip">Finals</span>
                  <span className="landing-chip">Sessionals</span>
                </div>
              </div>

              <div className="landing-mini-card">
                <span className="landing-mini-tag">Semester 1</span>
                <p className="landing-mini-title">Calculus (CAL)</p>
                <p className="landing-mini-desc">Analytical problem sets & past exam papers</p>
                <div className="landing-mini-badge-row">
                  <span className="landing-chip">Finals</span>
                  <span className="landing-chip">Sessionals</span>
                </div>
              </div>

              <div className="landing-mini-card">
                <span className="landing-mini-tag">Semester 2</span>
                <p className="landing-mini-title">Digital Logic Design (DLD)</p>
                <p className="landing-mini-desc">Logic circuits & processor exam papers</p>
                <div className="landing-mini-badge-row">
                  <span className="landing-chip">Finals</span>
                  <span className="landing-chip">Mids</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2. LIVE TIMETABLE WITH INTEGRATED FREE ROOMS ──────────── */}
        <section className="landing-feature-card reverse">
          <div className="landing-feature-content">
            <span className="landing-feature-tag">02 · Real-Time Schedule & Free Rooms</span>
            <h2 className="landing-feature-heading">
              Live Timetable & Room Vacancy
            </h2>
            <p className="landing-feature-text">
              Real-time synchronization with the official FAST Google Sheets timetable.
              Whenever a class moves, a room changes, or a makeup lecture is scheduled,
              FastiFlex automatically updates with zero manual refresh required.
            </p>

            <ul className="landing-feature-list">
              <li>
                <span className="landing-check-icon">✓</span>
                <span>Active class detector with live countdown to next lecture</span>
              </li>
              <li>
                <span className="landing-check-icon">✓</span>
                <span>Day Timeline view & full Week Matrix grid across all batches</span>
              </li>
              <li>
                <span className="landing-check-icon">✓</span>
                <span>Integrated Room Vacancy Tracker — spot free classrooms during breaks</span>
              </li>
            </ul>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
              <Link href="/timetable" className="landing-feature-link" style={{ marginTop: 0 }}>
                <span>Open Live Timetable</span>
                <span className="landing-arrow">→</span>
              </Link>
              <Link href="/findroom" className="landing-feature-link" style={{ marginTop: 0, opacity: 0.88 }}>
                <span>Find Free Rooms</span>
                <span className="landing-arrow">→</span>
              </Link>
            </div>
          </div>

          <div className="landing-preview-box">
            <div className="landing-timetable-mockup">
              <div className="landing-mockup-header">
                <div>
                  <span className="landing-live-indicator">
                    <span className="landing-pulse-dot" /> Live Synced
                  </span>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: '4px 0 0', color: 'var(--ink-1)' }}>
                    BS CS 2026 · Section A
                  </p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', background: 'rgba(22,163,74,0.08)', padding: '2px 8px', borderRadius: 999 }}>
                  Lecture in Progress
                </span>
              </div>

              <div className="landing-timeline-item active">
                <div className="landing-timeline-time">
                  <strong>08:30</strong>
                  <span>09:50</span>
                </div>
                <div className="landing-timeline-body">
                  <p className="landing-timeline-course">Programming Fundamentals</p>
                  <p className="landing-timeline-meta">Room C-301 · Dr. Kashif Munir</p>
                </div>
              </div>

              <div className="landing-timeline-item">
                <div className="landing-timeline-time">
                  <strong>10:00</strong>
                  <span>11:20</span>
                </div>
                <div className="landing-timeline-body">
                  <p className="landing-timeline-course">Applied Physics</p>
                  <p className="landing-timeline-meta">Room C-304 · Dr. Muhammad Asim</p>
                </div>
              </div>

              {/* Integrated Free Rooms Box inside Timetable */}
              <div className="landing-mockup-rooms-strip">
                <div className="landing-mockup-rooms-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="landing-pulse-dot" style={{ width: 6, height: 6 }} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: -0.1 }}>
                      Free Rooms Right Now
                    </span>
                  </div>
                  <Link href="/findroom" className="landing-mockup-rooms-link" id="landing-free-rooms-link">
                    <span>Find Free Rooms</span>
                    <span>→</span>
                  </Link>
                </div>
                <div className="landing-mockup-rooms-chips">
                  <div className="landing-mockup-chip">
                    <span className="landing-mockup-chip-name">C-301</span>
                    <span className="landing-mockup-chip-tag">Free Now</span>
                  </div>
                  <div className="landing-mockup-chip">
                    <span className="landing-mockup-chip-name">CS Lab 3</span>
                    <span className="landing-mockup-chip-tag">Free Now</span>
                  </div>
                  <div className="landing-mockup-chip">
                    <span className="landing-mockup-chip-name">D-102</span>
                    <span className="landing-mockup-chip-tag">Free Now</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div>
            <p className="landing-footer-logo">
              <span className="landing-logo-accent">Fasti</span>Flex
            </p>
            <p className="landing-footer-sub">
              Crafted with care for students of FAST-NUCES Islamabad.
            </p>
          </div>

          <div className="landing-footer-links">
            <Link href="/pastpapers">Past Papers</Link>
            <Link href="/timetable">Timetable</Link>
            <Link href="/findroom">Find Room</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

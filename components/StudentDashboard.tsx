'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { auth, dashboardError, dashboardRef, saveDashboardCourses, signInToDashboard, signOutOfDashboard } from '@/lib/dashboard-account';
import { readCourseIds } from '@/lib/dashboard-data';
import DashboardWorkspace from './DashboardWorkspace';
import DashboardLoading from './DashboardLoading';
import Icon from './Icon';

type AccountState = { user: User | null; checking: boolean; loaded: boolean; ids: string[]; error: string };
const initialState: AccountState = { user: null, checking: true, loaded: false, ids: [], error: '' };

function GoogleMark() {
  return <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.43h11a9.4 9.4 0 0 1-4.08 6.17v5h6.61c3.87-3.56 6.08-8.8 6.08-14.68Z" /><path fill="#34A853" d="M24 44c5.5 0 10.12-1.82 13.5-4.94l-6.6-5c-1.82 1.22-4.14 1.96-6.9 1.96-5.3 0-9.8-3.58-11.41-8.4H5.77v5.14A20 20 0 0 0 24 44Z" /><path fill="#FBBC05" d="M12.59 27.62a12 12 0 0 1 0-7.24v-5.14H5.77a20 20 0 0 0 0 17.52l6.82-5.14Z" /><path fill="#EA4335" d="M24 11.98c3 0 5.68 1.04 7.8 3.07l5.85-5.85A19.58 19.58 0 0 0 24 4 20 20 0 0 0 5.77 15.24l6.82 5.14C14.2 15.56 18.7 11.98 24 11.98Z" /></svg>;
}

export default function StudentDashboard() {
  const [account, setAccount] = useState<AccountState>(initialState);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    let generation = 0;
    let stopCourses: (() => void) | undefined;
    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    const stopAuth = onAuthStateChanged(auth, user => {
      const current = ++generation;
      stopCourses?.();
      clearTimeout(loadTimer);
      setAccount({ user, checking: false, loaded: false, ids: [], error: '' });
      if (!user) return;
      loadTimer = setTimeout(() => {
        if (active && current === generation) setAccount(state => ({ ...state, error: 'Your courses are taking a while to load. Check your connection, then retry.' }));
      }, 15000);
      stopCourses = onSnapshot(dashboardRef(user.uid), { includeMetadataChanges: true }, snapshot => {
        if (!active || current !== generation) return;
        // Do not present a cache miss as an empty account while offline.
        if (!snapshot.exists() && snapshot.metadata.fromCache) return;
        clearTimeout(loadTimer);
        setAccount({ user, checking: false, loaded: true, ids: readCourseIds(snapshot.data()?.courseIds), error: '' });
      }, error => {
        clearTimeout(loadTimer);
        if (active && current === generation) setAccount(state => ({ ...state, loaded: false, error: dashboardError(error) }));
      });
    }, error => {
      if (active) setAccount({ ...initialState, checking: false, error: dashboardError(error) });
    });
    return () => { active = false; generation++; stopAuth(); stopCourses?.(); clearTimeout(loadTimer); };
  }, [retry]);

  const accountAction = async (action: () => Promise<unknown>) => {
    setBusy(true); setActionError('');
    try { await action(); } catch (error) { setActionError(dashboardError(error)); }
    finally { setBusy(false); }
  };

  return <div className="dashboard-page">
    <a className="skip-link" href="#dashboard-main">Skip to dashboard</a>
    <header className="site-header"><div className="container header-inner dashboard-header">
      <Link href="/" className="brand" aria-label="FastianHub home"><span className="brand-mark"><Icon name="book" size={22} /></span><span>Fastian<span className="brand-light">Hub</span><small>THE STUDENT ARCHIVE</small></span></Link>
      <div className="dashboard-header-actions"><Link href="/" className="text-button">Past papers</Link>{account.user && <button className="dashboard-entry" disabled={busy} onClick={() => void accountAction(signOutOfDashboard)}>{busy ? 'Please wait…' : 'Sign out'}</button>}</div>
    </div></header>
    <main className="container" id="dashboard-main">
      <section className={`dashboard-intro${account.user || account.checking ? ' dashboard-intro-compact' : ' dashboard-intro-welcome'}`}><h1>{account.user ? <>My <em>dashboard.</em></> : <>Your FAST NUCES courses.<br /><em>All together.</em></>}</h1><p>{account.user ? 'A little less searching. A little more studying.' : 'Past papers, quizzes, notes, and study resources in one quiet place.'}</p></section>
      {actionError && <p className="dashboard-alert" role="alert">{actionError}</p>}
      {account.error && <div className="dashboard-alert" role="alert"><p>{account.error}</p><button className="text-button" onClick={() => { setAccount(initialState); setRetry(value => value + 1); }}>Retry</button></div>}
      {account.checking ? <DashboardLoading /> : !account.user ? <section className="dashboard-welcome" aria-labelledby="dashboard-welcome-title">
        <div className="dashboard-welcome-copy"><h2 id="dashboard-welcome-title">Your FAST study resources, together.</h2><p>Sign in to save courses and find FAST NUCES past papers, quizzes, and notes in one place on any device.</p><button className="google-signin" disabled={busy} onClick={() => void accountAction(signInToDashboard)}><GoogleMark />{busy ? 'Opening Google…' : 'Continue with Google'}</button><p className="dashboard-fine-print">New here? Your account is created when you sign in.</p><p className="dashboard-fine-print">We use your Google name and email to sign you in and store your chosen course list.</p></div>
      </section> : account.loaded ? <DashboardWorkspace key={account.user.uid} selectedIds={account.ids} onSave={(original, draft) => saveDashboardCourses(account.user!.uid, original, draft)} /> : !account.error && <DashboardLoading />}
    </main>
    <footer className="container site-footer"><p>Made for the days before the exam.</p><Link href="/">Browse FAST NUCES past papers <Icon name="arrow" size={15} /></Link></footer>
  </div>;
}

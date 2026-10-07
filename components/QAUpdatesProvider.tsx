'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { answerVersion, readAnswers } from '@/lib/qa-read-state';

export type TrackedQuestion = {
  id: string;
  question: string;
  createdAt: number;
  status: 'checking' | 'pending' | 'answered' | 'unavailable';
  version?: string;
};
type State = { uid: string | null; questions: TrackedQuestion[]; seen: Record<string, string>; error: boolean };
const initial: State = { uid: null, questions: [], seen: {}, error: false };
export const QAUpdatesContext = createContext<State & { unread: number; markRead: (id: string, version: string) => void }>({ ...initial, unread: 0, markRead: () => {} });

export function useQAUpdates() { return useContext(QAUpdatesContext); }

export default function QAUpdatesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);

  useEffect(() => {
    let active = true;
    let generation = 0;
    let stopAuth: (() => void) | undefined;
    let stopTracking: (() => void) | undefined;
    let stopAnswers: (() => void)[] = [];
    const clearAnswers = () => { stopAnswers.forEach(stop => stop()); stopAnswers = []; };

    async function start() {
      try {
        const [{ onAuthStateChanged }, { collection, doc, onSnapshot }, { auth }, { db }] = await Promise.all([
          import('firebase/auth'), import('firebase/firestore'), import('@/lib/dashboard-account'), import('@/lib/firebase'),
        ]);
        if (!active) return;
        stopAuth = onAuthStateChanged(auth, user => {
          const current = ++generation;
          stopTracking?.();
          clearAnswers();
          setState(user ? { ...initial, uid: user.uid, seen: readAnswers(user.uid) } : initial);
          if (!user) return;
          let revision = 0;
          const valid = () => active && current === generation;
          stopTracking = onSnapshot(collection(db, 'qaTracking', user.uid, 'questions'), snapshot => {
            if (!valid()) return;
            const currentRevision = ++revision;
            clearAnswers();
            const entries: TrackedQuestion[] = snapshot.docs.map(item => {
              const data = item.data();
              return {
                id: item.id,
                question: typeof data.question === 'string' ? data.question : 'Your question',
                createdAt: typeof data.createdAt?.toMillis === 'function' ? data.createdAt.toMillis() : 0,
                status: 'checking',
              };
            });
            setState(previous => ({ ...previous, questions: entries, error: false }));
            for (const entry of entries) {
              stopAnswers.push(onSnapshot(doc(db, 'questions', entry.id), { includeMetadataChanges: true }, answer => {
                if (!valid() || revision !== currentRevision || answer.metadata.fromCache) return;
                const text = answer.data()?.answer;
                const answered = typeof text === 'string' && !!text.trim();
                const status = !answer.exists() ? 'unavailable' : answered ? 'answered' : 'pending';
                setState(previous => ({ ...previous, questions: previous.questions.map(item => item.id === entry.id
                  ? { ...item, status, version: answered ? answerVersion(text) : undefined } : item) }));
              }, () => {
                if (valid() && revision === currentRevision) setState(previous => ({ ...previous, questions: previous.questions.map(item => item.id === entry.id ? { ...item, status: 'unavailable', version: undefined } : item) }));
              }));
            }
          }, () => {
            if (valid()) {
              revision++;
              clearAnswers();
              setState(previous => ({ ...previous, questions: [], error: true }));
            }
          });
        }, () => { if (active) setState({ ...initial, error: true }); });
      } catch { if (active) setState({ ...initial, error: true }); }
    }
    void start();
    return () => { active = false; generation++; stopAuth?.(); stopTracking?.(); clearAnswers(); };
  }, []);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (state.uid && (event.key === `qa-read:${state.uid}` || event.key === null)) {
        const seen = readAnswers(state.uid);
        setState(previous => ({ ...previous, seen }));
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [state.uid]);

  const markRead = useCallback((id: string, version: string) => {
    if (!state.uid || state.seen[id] === version) return;
    const seen = { ...state.seen, ...readAnswers(state.uid), [id]: version };
    try { localStorage.setItem(`qa-read:${state.uid}`, JSON.stringify(seen)); } catch { /* Still clear it for this visit. */ }
    setState(previous => previous.uid === state.uid ? { ...previous, seen } : previous);
  }, [state.uid, state.seen]);

  const unread = state.questions.filter(item => item.status === 'answered' && state.seen[item.id] !== item.version).length;
  return <QAUpdatesContext.Provider value={{ ...state, unread, markRead }}>{children}</QAUpdatesContext.Provider>;
}

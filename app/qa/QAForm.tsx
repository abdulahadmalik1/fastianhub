'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import GoogleMark from '@/components/GoogleMark';
import { auth, dashboardError, signInToDashboard } from '@/lib/dashboard-account';
import styles from './qa.module.css';

const QUESTION_LIMIT = 500;

/**
 * Client-only ask form. Extracted from the original Questions component so
 * the /qa page can be a Server Component while preserving the submit UX.
 */
export default function QAForm() {
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [notify, setNotify] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInError, setSignInError] = useState('');
  const signInAttempt = useRef(0);
  const submittingRef = useRef(false);
  const questionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stop = onAuthStateChanged(auth, account => {
      setUser(account);
      if (!account) setNotify(false);
    });
    // Invalidate the latest request on unmount, not the value from mount time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { stop(); signInAttempt.current++; };
  }, []);

  function closeSignIn() {
    signInAttempt.current++;
    setShowSignIn(false);
    setSigningIn(false);
    setSignInError('');
    setNotify(false);
  }

  function changeNotify(checked: boolean) {
    setSubmitError('');
    setSubmitted(false);
    if (!checked || auth.currentUser) { setNotify(checked); return; }
    signInAttempt.current++;
    setSignInError('');
    setShowSignIn(true);
  }

  async function handleSignIn() {
    const attempt = ++signInAttempt.current;
    setSigningIn(true);
    setSignInError('');
    try {
      await signInToDashboard();
      // Dismissing the dialog cancels the notification request, even if the
      // separate Google window finishes signing in afterwards.
      if (attempt !== signInAttempt.current) return;
      if (!auth.currentUser?.email) throw new Error('Use a Google account with an email address to enable answer updates.');
      setNotify(true);
      setShowSignIn(false);
    } catch (error) {
      if (attempt !== signInAttempt.current) return;
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') closeSignIn();
      else setSignInError(dashboardError(error));
    } finally {
      if (attempt === signInAttempt.current) setSigningIn(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    setSubmitted(false);
    setSubmitError('');

    const form = event.currentTarget;
    if (new FormData(form).get('website')) { setQuestion(''); setSubmitted(true); return; }

    const cleanQuestion = question.trim();
    if (!cleanQuestion || question.length > QUESTION_LIMIT) {
      setSubmitError(`Enter a question of up to ${QUESTION_LIMIT} characters.`);
      questionRef.current?.focus();
      return;
    }
    if (!navigator.onLine) { setSubmitError('You appear to be offline.'); return; }
    if (notify && !auth.currentUser) {
      setNotify(false);
      changeNotify(true);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const account = notify ? auth.currentUser : null;
      if (notify && !account?.email) throw new Error('A Google account with an email address is needed to track your answer. Your question was not sent.');

      // Readers do not need the Firebase SDK. Load it only for a valid submit.
      const [{ doc, collection, serverTimestamp, writeBatch }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('@/lib/firebase'),
      ]);

      const batch = writeBatch(db);
      const newQuestionRef = doc(collection(db, 'questions'));
      batch.set(newQuestionRef, {
        question: cleanQuestion,
        answer: '',
        createdAt: serverTimestamp(),
      });

      if (notify && account?.email) {
        const trackingRef = doc(db, 'qaTracking', account.uid, 'questions', newQuestionRef.id);
        batch.set(trackingRef, {
          question: cleanQuestion,
          email: account.email,
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
      void fetch('/api/slack/track', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ type: 'question', project: 'FastianHub', question: cleanQuestion, timestamp: Date.now() }),
      }).catch(() => { /* Slack notification must never affect submission. */ });
      setQuestion('');
      setSubmitted(true);
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      if (code.startsWith('auth/')) setSubmitError(`${dashboardError(error)} Your question was not sent.`);
      else if (error instanceof Error && error.message.includes('needed to track')) setSubmitError(error.message);
      else setSubmitError(notify
        ? 'Could not save answer tracking. Your question was not sent; please try again.'
        : "Couldn't send your question. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.ask} aria-labelledby="ask-title">
      <h2 id="ask-title">What&apos;s on your mind?</h2>
      <p className={styles.hint}>Ask anything about FAST-NUCES.</p>
      <noscript><p className={styles.hint}>Enable JavaScript to send a question. You can read all published answers below.</p></noscript>
      <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
        <label className="sr-only" htmlFor="question">Your question</label>
        <textarea
          ref={questionRef}
          id="question"
          name="question"
          rows={3}
          maxLength={QUESTION_LIMIT}
          className={styles.textarea}
          placeholder="Ask anything about FAST-NUCES…"
          required
          aria-describedby={submitError ? 'question-error' : undefined}
          aria-invalid={submitError ? true : undefined}
          disabled={submitting}
          value={question}
          onChange={e => { setQuestion(e.target.value); setSubmitError(''); setSubmitted(false); }}
        />
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor="question-website">Leave this field empty</label>
          <input id="question-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <div className={styles.formFooter}>
          <div className={styles.notifyControls}>
            <label className={styles.notifyChoice}>
              <input type="checkbox" checked={notify && !!user} onChange={event => changeNotify(event.target.checked)} disabled={submitting} />
              <span>Notify me</span>
            </label>
          </div>
          <button className="primary-button" type="submit" disabled={submitting || signingIn}>
            {submitting ? 'Sending…' : 'Send question'}<Icon name="arrow" size={16} />
          </button>
        </div>
        {submitted && <span className={styles.success} role="status"><Icon name="check" size={15} />Question sent</span>}
        {submitError && <p id="question-error" className={styles.error} role="alert">{submitError}</p>}
      </form>
      {showSignIn && <Modal labelledBy="notify-signin-title" onClose={closeSignIn} className={styles.notifyDialog}>
        <button type="button" className={styles.notifyClose} onClick={closeSignIn} aria-label="Close sign-in"><Icon name="close" size={13} /></button>
        <div className={styles.notifyDialogHeading}>
          <h2 id="notify-signin-title">Stay in the loop</h2>
        </div>
        <p className={styles.notifyExplanation}>Sign in to get answer updates in your dashboard.</p>
        <button type="button" className={styles.notifyGoogle} disabled={signingIn} onClick={() => void handleSignIn()}>
          <GoogleMark size={18} /><span>{signingIn ? 'Connecting…' : 'Continue with Google'}</span>
        </button>
        <p className={styles.notifyFinePrint}>One step to sign in or create an account.</p>
        {signInError && <p className={styles.error} role="alert">{signInError}</p>}
      </Modal>}
    </section>
  );
}

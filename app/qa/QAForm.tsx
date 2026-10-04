'use client';

import { useRef, useState, type FormEvent } from 'react';
import Icon from '@/components/Icon';
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
  const submittingRef = useRef(false);
  const questionRef = useRef<HTMLTextAreaElement>(null);

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

    submittingRef.current = true;
    setSubmitting(true);
    try {
      // Readers do not need the Firebase SDK. Load it only for a valid submit.
      const [{ addDoc, collection, serverTimestamp }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('@/lib/firebase'),
      ]);
      await addDoc(collection(db, 'questions'), {
        question: cleanQuestion,
        answer: '',
        createdAt: serverTimestamp(),
      });
      setQuestion('');
      setSubmitted(true);
    } catch {
      setSubmitError("Couldn't send your question. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.ask} aria-labelledby="ask-title">
      <h2 id="ask-title">What&apos;s on your mind?</h2>
      <p className={styles.hint}>Fully anonymous.</p>
      <noscript><p className={styles.hint}>Enable JavaScript to send a question. You can read all published answers below.</p></noscript>
      <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
        <label className="sr-only" htmlFor="question">Your question</label>
        <textarea
          ref={questionRef}
          id="question"
          name="question"
          rows={4}
          maxLength={QUESTION_LIMIT}
          className={styles.textarea}
          placeholder="Ask anything about FAST-NUCES…"
          required
          aria-describedby={`question-count${submitError ? ' question-error' : ''}`}
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
          <span id="question-count" className={styles.count}>{question.length} / {QUESTION_LIMIT}</span>
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send question'}<Icon name="arrow" size={16} />
          </button>
        </div>
        {submitError && <p id="question-error" className={styles.error} role="alert">{submitError}</p>}
        {submitted && (
          <p className={styles.success} role="status">
            <Icon name="check" size={18} />Thanks! It&apos;ll appear here once answered.
          </p>
        )}
      </form>
    </section>
  );
}

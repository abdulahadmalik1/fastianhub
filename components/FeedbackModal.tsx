'use client';

import { useState, useEffect } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'suggestion' | 'feedback' | 'request_tool';

const FEEDBACK_TYPES: Array<{ id: FeedbackType; label: string; icon: string; desc: string }> = [
  { id: 'suggestion', label: 'Suggestion', icon: '💡', desc: 'Feature ideas or enhancements' },
  { id: 'feedback', label: 'Feedback', icon: '💬', desc: 'General thoughts or user experience' },
  { id: 'request_tool', label: 'Request Tool', icon: '🛠️', desc: 'Request a new student utility' },
];

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [message, setMessage] = useState('');

  const [errors, setErrors] = useState<{ message?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset form when modal re-opens
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setSubmitError(null);
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { message?: string } = {};

    const cleanMsg = message.trim();
    if (!cleanMsg) {
      errs.message = 'Please enter your message or request description';
    } else if (cleanMsg.length < 5) {
      errs.message = 'Please provide a little more detail (at least 5 characters)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const typeMeta = FEEDBACK_TYPES.find((t) => t.id === feedbackType)?.label || feedbackType;

    try {
      const res = await fetch('https://formspree.io/f/mdeklpnp', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackType: typeMeta,
          message: message.trim(),
          source: 'FastianHub Feedback & Tool Requests',
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Submission failed. Please try again.');
      }

      setIsSuccess(true);
      setMessage('');
    } catch (err: any) {
      setSubmitError(err.message || 'Network error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholder = () => {
    switch (feedbackType) {
      case 'request_tool':
        return 'e.g. GPA calculator, attendance tracker, schedule clash finder, CGPA target planner...';
      case 'suggestion':
        return 'e.g. Filter courses by exam year or term, quick batch download, outline preview...';
      case 'feedback':
      default:
        return 'Tell us what you think of FastianHub, what works well, or what we can improve...';
    }
  };

  return (
    <div
      className="repo-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div className="repo-modal">
        {/* Header */}
        <div className="repo-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="repo-modal-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h2 id="feedback-modal-title" className="repo-modal-title">
                Suggestions, Feedback & Tools
              </h2>
              <p className="repo-modal-sub">
                Suggest features, share thoughts, or request new tools to be built.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div className="repo-modal-success">
            <div className="repo-success-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-1)', margin: '14px 0 6px' }}>
              Submission Received!
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: 360, margin: '0 auto 20px' }}>
              Thank you for contributing your ideas! We read every suggestion and tool request as we build the next FastianHub tools.
            </p>
            <button
              type="button"
              className="repo-modal-submit-btn"
              onClick={onClose}
              style={{ width: '100%', maxWidth: 220 }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {submitError && (
              <div className="repo-modal-alert error">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{submitError}</span>
              </div>
            )}

            {/* Category / Type Selector */}
            <div className="feedback-type-group">
              <label className="repo-form-label">Select Category</label>
              <div className="feedback-pills">
                {FEEDBACK_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`feedback-pill ${feedbackType === t.id ? 'active' : ''}`}
                    onClick={() => setFeedbackType(t.id)}
                    title={t.desc}
                  >
                    <span className="feedback-pill-icon">{t.icon}</span>
                    <span className="feedback-pill-label">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Field: Message */}
            <div className="repo-form-group">
              <label htmlFor="feedback-message-input" className="repo-form-label">
                {feedbackType === 'request_tool'
                  ? 'Which tool would you like us to build?'
                  : feedbackType === 'suggestion'
                  ? 'What is your suggestion?'
                  : 'Your feedback'}{' '}
                <span className="req-star">*</span>
              </label>
              <textarea
                id="feedback-message-input"
                className={`repo-input repo-textarea ${errors.message ? 'error' : ''}`}
                placeholder={getPlaceholder()}
                rows={3}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors({ ...errors, message: undefined });
                }}
                disabled={isSubmitting}
                autoFocus
              />
              {errors.message && <p className="repo-field-error">{errors.message}</p>}
            </div>

            {/* Actions */}
            <div className="repo-modal-actions">
              <button
                type="button"
                className="repo-modal-cancel-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="repo-modal-submit-btn"
                disabled={isSubmitting}
                id="submit-feedback-form-btn"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-sm" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Message</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

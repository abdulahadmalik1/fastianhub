'use client';

import { useState } from 'react';
import Modal from './Modal';

interface SubmitRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmitRepoModal({ isOpen, onClose }: SubmitRepoModalProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [errors, setErrors] = useState<{ repoUrl?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { repoUrl?: string } = {};

    const cleanUrl = repoUrl.trim();
    if (!cleanUrl) {
      errs.repoUrl = 'Repository URL is required';
    } else {
      const urlPattern = /^(https?:\/\/)?(www\.)?(github\.com|gitlab\.com|bitbucket\.org)\/[\w.-]+\/[\w.-]+/i;
      const genericUrlPattern = /^(https?:\/\/)?([\w.-]+\.[a-z]{2,})(\/.*)?$/i;
      if (!urlPattern.test(cleanUrl) && !genericUrlPattern.test(cleanUrl)) {
        errs.repoUrl = 'Please enter a valid Git repository URL (e.g. https://github.com/username/past-papers)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('https://formspree.io/f/mdeklpnp', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          source: 'FastianHub Web App',
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Submission failed. Please try again.');
      }

      setIsSuccess(true);
      setRepoUrl('');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Network error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal labelledBy="submit-repo-title" onClose={onClose} dismissible={!isSubmitting}>
      <div className="repo-modal">
        {/* Header */}
        <div className="repo-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="repo-modal-icon-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </div>
            <div>
              <h2 id="submit-repo-title" className="repo-modal-title">
                Contribute Repository
              </h2>
              <p className="repo-modal-sub">
                Share a past papers or notes repository for indexing.
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
            <div className="repo-success-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-1)', margin: '14px 0 6px' }}>
              Submission Received!
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: 360, margin: '0 auto 20px' }}>
              Thank you for contributing! Your repository link has been received and will be reviewed and indexed on FastianHub.
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
              <div className="repo-modal-alert error" role="alert">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{submitError}</span>
              </div>
            )}

            {/* Field: Repo URL */}
            <div className="repo-form-group">
              <label htmlFor="repo-url-input" className="repo-form-label">
                Repository URL <span className="req-star">*</span>
              </label>
              <div className="repo-input-wrap">
                <svg className="repo-field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <input
                  id="repo-url-input"
                  type="url"
                  className={`repo-input ${errors.repoUrl ? 'error' : ''}`}
                  placeholder="https://github.com/username/past-papers"
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    if (errors.repoUrl) setErrors({ ...errors, repoUrl: undefined });
                  }}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              {errors.repoUrl && <p className="repo-field-error" role="alert">{errors.repoUrl}</p>}
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
                id="submit-repo-form-btn"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-sm" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Repository</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}


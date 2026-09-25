'use client';
import { useState } from 'react';
import Link from 'next/link';
import rawContributors from '@/data/contributors.json';
import pastPapersData from '@/data/pastPapers.json';
import SubmitRepoModal from '@/components/SubmitRepoModal';
import Icon from '@/components/Icon';
import type { CampusMetadata } from '@/lib/papers';

export default function CreditsPage() {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const campuses = pastPapersData.campuses as unknown as Record<string, CampusMetadata>;
  const contributors = rawContributors.filter(contributor => contributor.verified).map(contributor => ({ ...contributor, paperCount: campuses[contributor.campusId]?.totalFiles || contributor.paperCount }));
  return <div className="app-shell credits-page">
    <header className="site-header"><div className="container header-inner"><Link href="/" className="brand" aria-label="FastianHub home"><span className="brand-mark"><Icon name="book" size={22} /></span><span>Fastian<span className="brand-light">Hub</span><small>THE STUDENT ARCHIVE</small></span></Link><Link href="/" className="text-button">Past papers <Icon name="arrow" size={18} /></Link></div></header>
    <main className="container"><section className="credits-intro"><p className="eyebrow">THE PEOPLE BEHIND THE PAPERS</p><h1>A shared effort.<br /><em>A little gratitude.</em></h1><p>This archive exists because students shared what helped them. Meet the contributors keeping those resources within reach.</p></section>
      <div className="credits-grid">{contributors.map(contributor => <article key={contributor.id} className="credit-card"><span className="course-icon"><Icon name="book" size={20} /></span><h2>{contributor.name}</h2><p>{contributor.paperCount.toLocaleString()} files in the collection</p><p>{contributor.sourceUrl.replace(/^https?:\/\//, '')}</p><a href={contributor.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-button">Visit collection <Icon name="external" size={15} /></a></article>)}</div>
      <aside className="community-note"><div><h2>Your collection could help someone, too.</h2><p>Share a repository of papers or notes with the community.</p></div><button className="text-button" onClick={() => setIsSubmitModalOpen(true)}>Contribute papers <Icon name="arrow" size={18} /></button></aside>
    </main><footer className="container site-footer"><p>By Fastians, for Fastians.</p><Link className="text-button" href="/">Back to past papers</Link></footer>
    {isSubmitModalOpen && <SubmitRepoModal isOpen onClose={() => setIsSubmitModalOpen(false)} />}
  </div>;
}

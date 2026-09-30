'use client';
// Temporary local preview, removed after verification.
import { useState } from 'react';
import Link from 'next/link';
import DashboardWorkspace from '@/components/DashboardWorkspace';
import Icon from '@/components/Icon';
import data from '@/data/pastPapers.json';
import { buildDashboardCatalog, groupDashboardCourses } from '@/lib/dashboard-data';
import type { CampusMetadata } from '@/lib/papers';
const groups = groupDashboardCourses(buildDashboardCatalog(data.campuses as unknown as Record<string, CampusMetadata>));
export default function Preview() {
  const [ids, setIds] = useState(groups.filter(group => ['Programming Fundamentals', 'Object Oriented Programming', 'Calculus'].includes(group.name)).flatMap(group => group.courses.map(course => course.id)));
  return <div className="dashboard-page"><header className="site-header"><div className="container header-inner dashboard-header"><Link href="/" className="brand"><span className="brand-mark"><Icon name="book" size={22} /></span><span>Fastian<span className="brand-light">Hub</span><small>THE STUDENT ARCHIVE</small></span></Link><Link className="text-button" href="/">Past papers</Link></div></header><main className="container"><section className="dashboard-intro dashboard-intro-compact"><h1>My <em>dashboard.</em></h1><p>A little less searching. A little more studying.</p></section><DashboardWorkspace selectedIds={ids} onSave={async (_, draft) => setIds(draft)} /></main></div>;
}

export default function DashboardLoading() {
  return <div className="dashboard-skeleton" role="status" aria-label="Loading your courses">
    <span className="sr-only">Loading your courses and materials…</span>
    <div className="dashboard-skeleton-courses" aria-hidden="true"><div className="skeleton-line short" /><div className="dashboard-skeleton-chips">{[0, 1, 2].map(item => <div className="skeleton-line course" key={item} />)}</div></div>
    <div className="dashboard-skeleton-materials" aria-hidden="true"><div className="skeleton-line control" />{[0, 1, 2, 3, 4].map(item => <div className="skeleton-resource" key={item}><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}</div>
  </div>;
}

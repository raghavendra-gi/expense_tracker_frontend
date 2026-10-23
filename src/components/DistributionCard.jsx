export default function DistributionCard({ expenses }) {
  const total = expenses.length;
  const by = (status) => expenses.filter((e) => e.status === status).length;

  const buckets = [
    { key: 'approved',   label: 'Approved',    caption: 'Verified',    ic: 'i-check',  color: 'var(--st-good)',      n: by('Approved') },
    { key: 'pending',    label: 'Pending',     caption: 'Awaiting',    ic: 'i-clock',  color: 'var(--st-warning)',   n: by('Pending') },
    { key: 'rejected',   label: 'Rejected',    caption: 'Rejected',    ic: 'i-x',      color: 'var(--st-critical)',  n: by('Rejected') },
    { key: 'inprogress', label: 'In Progress', caption: 'In Progress', ic: 'i-route',  color: 'var(--ch-series-1)',  n: by('In Progress') },
  ].map((b) => ({ ...b, pct: total ? Math.round((b.n / total) * 100) : 0 }));

  let cursor = 0;
  const stops = buckets
    .map((b) => {
      const start = cursor;
      const end = cursor + (total ? (b.n / total) * 100 : 0);
      cursor = end;
      return `${b.color} ${start}% ${end}%`;
    })
    .join(', ');

  const donutStyle = total
    ? { '--donut-stops': stops }
    : { '--donut-stops': 'var(--border) 0 100%' };

  return (
    <div className="dist-card">
      <div className="card-title">Expense Status Distribution</div>
      <div className="dist-body">
        <div className="donut-wrap">
          <div className="donut" style={donutStyle}></div>
          <div className="donut-hole">
            <div className="n">{total}</div>
            <div className="lbl">Total</div>
          </div>
        </div>
        <div className="dist-grid">
          {buckets.map((b) => (
            <div key={b.key} className="dist-item" data-status={b.key}>
              <div className="top">
                <span className="name">
                  <span className="status-ic">
                    <svg className="icon"><use href={`#${b.ic}`} /></svg>
                  </span>
                  {b.label}
                </span>
                <span className="figures">
                  <span className="pct">{b.pct}%</span>
                  <span className="sub">{b.caption}</span>
                </span>
              </div>
              <div className="bar">
                <span style={{ width: `${b.pct}%` }}></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
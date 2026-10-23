import { formatMoney } from '../utils/format';

export default function StatCards({ expenses }) {
  const sum = (list) => list.reduce((s, e) => s + (Number(e.data?.amount) || 0), 0);
  const by = (status) => expenses.filter((e) => e.status === status);

  const approved = by('Approved');
  const pending  = by('Pending');
  const rejected = by('Rejected');
  const progress = by('In Progress');

  const cards = [
    { label: 'Total Requests', n: expenses.length, money: sum(expenses), icon: 'i-list', tone: 'info' },
    { label: 'Approved', n: approved.length, money: sum(approved), icon: 'i-check', tone: 'good' },
    { label: 'Pending', n: pending.length, money: sum(pending), icon: 'i-clock', tone: 'warning' },
    { label: 'Rejected', n: rejected.length, money: sum(rejected), icon: 'i-x', tone: 'critical' },
    { label: 'In Progress', n: progress.length, money: sum(progress), icon: 'i-route', tone: 'info' },
  ];

  return (
    <div className="stats-grid">
      {cards.map((c, i) => (
        <div key={i} className="stat-card" data-tone={c.tone}>
          <h3>
            <svg className="icon"><use href={`#${c.icon}`} /></svg> {c.label}
          </h3>
          <div className="number">{c.n}</div>
          <div className="money">{formatMoney(c.money)}</div>
        </div>
      ))}
    </div>
  );
}
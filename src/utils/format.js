const DISPLAY_TZ = 'Asia/Kolkata';

export function formatDate(iso) {
  if (!iso) return '—';
  if (String(iso).length > 10 && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:/.test(String(iso))) {
    const d = new Date(iso.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z');
    if (!isNaN(d)) return d.toLocaleDateString('en-IN', {
      timeZone: DISPLAY_TZ, day: '2-digit', month: 'short', year: 'numeric'
    });
  }
  const p = String(iso).slice(0, 10).split('-').map(Number);
  if (p.length !== 3 || p.some(isNaN)) return iso;
  return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const s = String(iso).trim();
  const d = new Date(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(s) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(s)
    ? s.replace(' ', 'T') + 'Z' : s);
  if (isNaN(d)) return '—';
  return d.toLocaleString('en-IN', {
    timeZone: DISPLAY_TZ, day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatMoney(amount) {
  const n = Number(amount);
  if (!isFinite(n)) return '—';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function statusBadgeClass(status) {
  return 'badge-' + String(status || 'pending').toLowerCase().replace(/\s+/g, '');
}

export function statusIcon(status) {
  const map = {
    'Approved': 'i-check',
    'Pending': 'i-clock',
    'Rejected': 'i-x',
    'In Progress': 'i-route'
  };
  return map[status] || 'i-info';
}
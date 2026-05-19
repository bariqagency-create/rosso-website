// ─────────────────────────────────────────────────────────────
// Shared formatting helpers.
// ─────────────────────────────────────────────────────────────

const EGP_FMT = new Intl.NumberFormat('en-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 2,
});

export function fmtEGP(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return EGP_FMT.format(0);
  return EGP_FMT.format(v);
}

export function num(n, d = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : d;
}

export function isoToday() {
  return new Date().toISOString().split('T')[0];
}

export function isoMonth(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const dow = x.getDay(); // 0=Sun
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfMonth(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function dateOnly(s) {
  if (!s) return '';
  return String(s).split('T')[0];
}

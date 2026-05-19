// ─────────────────────────────────────────────────────────────
// ROSSO — Booking persistence (localStorage)
// Single source of truth for reading/writing booking records.
// ─────────────────────────────────────────────────────────────

// Shared storage key — used by BOTH the booking form and the /dashboard.
export const BOOKINGS_STORAGE_KEY = 'rosso_bookings';
const DRAFT_KEY = 'rosso_bookings_draft';

export const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const isBrowser = () => typeof window !== 'undefined';

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function getBookings() {
  if (!isBrowser()) return [];
  return safeParse(window.localStorage.getItem(BOOKINGS_STORAGE_KEY), []);
}

function writeBookings(list) {
  if (!isBrowser()) return;
  window.localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(list));
  // Notify other tabs / components
  window.dispatchEvent(new CustomEvent('rosso:bookings-changed'));
}

function generateRef() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RSO-${yy}${mm}${dd}-${rand}`;
}

export function saveBooking(data, meta = {}) {
  const list = getBookings();
  const vehicle = [data.brand, data.model].filter(Boolean).join(' ').trim();
  const service = (data.quickServices && data.quickServices.length > 0)
    ? data.quickServices.join(', ')
    : (data.description || '');
  const location = data.locationType === 'mobile'
    ? 'Mobile / Home Service'
    : data.locationType === 'center'
      ? 'Service Center Visit'
      : '';
  const record = {
    id: generateRef(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    // Top-level summary fields (per dashboard contract)
    customerName: data.name || '',
    phone: data.phone || '',
    vehicle,
    service,
    location,
    date: data.date || '',
    time: data.time || '',
    // Full payload retained so the dashboard / WhatsApp message keep working
    lang: meta.lang || 'en',
    data,
  };
  const next = [record, ...list];
  writeBookings(next);
  return record;
}

export function updateBookingStatus(id, status) {
  if (!STATUSES.includes(status)) return;
  const list = getBookings().map(b => (b.id === id ? { ...b, status } : b));
  writeBookings(list);
}

export function deleteBooking(id) {
  writeBookings(getBookings().filter(b => b.id !== id));
}

export function clearAllBookings() {
  writeBookings([]);
}

// ── Draft (in-progress form) ──────────────────────────────────
export function loadDraft() {
  if (!isBrowser()) return null;
  return safeParse(window.localStorage.getItem(DRAFT_KEY), null);
}

export function saveDraft(data, step) {
  if (!isBrowser()) return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step, savedAt: Date.now() }));
}

export function clearDraft() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(DRAFT_KEY);
}

// ── Helpers ───────────────────────────────────────────────────
export function formatBookingMessage(record, isAr = false) {
  const { data } = record;
  const L = (en, ar) => (isAr ? ar : en);
  const lines = [];

  lines.push(`🏁 *${L('NEW ROSSO BOOKING', 'حجز جديد - روسو')}*`);
  lines.push(`${L('Ref', 'مرجع')}: ${record.id}`);
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`👤 *${L('Customer', 'العميل')}*`);
  lines.push(`${L('Name', 'الاسم')}: ${data.name}`);
  lines.push(`${L('Phone', 'الهاتف')}: ${data.phone}`);
  if (data.whatsapp) lines.push(`WhatsApp: ${data.whatsapp}`);
  if (data.email) lines.push(`Email: ${data.email}`);
  lines.push('');
  lines.push(`🚗 *${L('Vehicle', 'السيارة')}*`);
  lines.push(`${L('Brand', 'الماركة')}: ${data.brand}`);
  lines.push(`${L('Model', 'الموديل')}: ${data.model}`);
  lines.push(`VIN: ${data.vin}`);
  lines.push('');
  lines.push(`🔧 *${L('Service Request', 'طلب الخدمة')}*`);
  if (data.quickServices?.length > 0) {
    lines.push(`${L('Quick services', 'خدمات سريعة')}: ${data.quickServices.join(', ')}`);
  }
  if (data.description) lines.push(`${L('Details', 'التفاصيل')}: ${data.description}`);
  if (data.needsSpare === true) {
    lines.push('');
    lines.push(`📦 *${L('Spare Part Request', 'طلب قطعة غيار')}*`);
    if (data.sparePart?.name) lines.push(`${L('Part', 'القطعة')}: ${data.sparePart.name}`);
    if (data.sparePart?.desc) lines.push(`${L('Description', 'الوصف')}: ${data.sparePart.desc}`);
    if (data.sparePart?.notes) lines.push(`${L('Notes', 'ملاحظات')}: ${data.sparePart.notes}`);
  }
  lines.push('');
  lines.push(`📍 *${L('Service Type', 'نوع الخدمة')}*`);
  lines.push(
    data.locationType === 'center'
      ? L('Service Center Visit', 'زيارة المركز')
      : L('Mobile / Home Service', 'خدمة منزلية')
  );
  if (data.locationType === 'mobile') {
    if (data.address) lines.push(`${L('Address', 'العنوان')}: ${data.address}`);
    if (data.mapsLink) lines.push(`Maps: ${data.mapsLink}`);
    if (data.locNotes) lines.push(`${L('Notes', 'ملاحظات')}: ${data.locNotes}`);
  }
  lines.push('');
  lines.push(`📅 *${L('Appointment', 'الموعد')}*`);
  lines.push(`${L('Date', 'التاريخ')}: ${data.date}`);
  lines.push(`${L('Time', 'الوقت')}: ${data.time}`);
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push(L('Sent via ROSSO booking platform', 'مرسل من منصة حجز روسو'));

  return lines.join('\n');
}

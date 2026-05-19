// ─────────────────────────────────────────────────────────────
// ROSSO — Booking persistence.
// Primary source: Supabase. localStorage is used as a soft offline
// mirror/fallback so the dashboard keeps working if the network or
// Supabase config is unavailable.
// ─────────────────────────────────────────────────────────────
import { supabase, supabaseConfigured, BOOKINGS_TABLE } from './supabase';

export const BOOKINGS_STORAGE_KEY = 'rosso_bookings';
const DRAFT_KEY = 'rosso_bookings_draft';

export const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
export { supabaseConfigured };

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

// ── localStorage mirror ───────────────────────────────────────
export function getLocalBookings() {
  if (!isBrowser()) return [];
  return safeParse(window.localStorage.getItem(BOOKINGS_STORAGE_KEY), []);
}

function writeLocalBookings(list) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('rosso:bookings-changed'));
  } catch {}
}

// ── Record helpers ────────────────────────────────────────────
function generateRef() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RSO-${yy}${mm}${dd}-${rand}`;
}

function buildRecord(data, meta = {}) {
  const vehicle = [data.brand, data.model].filter(Boolean).join(' ').trim();
  const service = (data.quickServices && data.quickServices.length > 0)
    ? data.quickServices.join(', ')
    : (data.description || '');
  const location = data.locationType === 'mobile'
    ? 'Mobile / Home Service'
    : data.locationType === 'center'
      ? 'Service Center Visit'
      : '';
  return {
    id: generateRef(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    customerName: data.name || '',
    phone: data.phone || '',
    vehicle,
    service,
    location,
    date: data.date || '',
    time: data.time || '',
    lang: meta.lang || 'en',
    data,
  };
}

function rowToRecord(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status || 'pending',
    customerName: row.customer_name || '',
    phone: row.phone || '',
    vehicle: row.vehicle || '',
    service: row.service || '',
    location: row.location || '',
    date: row.appointment_date || '',
    time: row.appointment_time || '',
    lang: row.lang || 'en',
    data: row.data || {},
  };
}

function recordToRow(rec) {
  return {
    id: rec.id,
    created_at: rec.createdAt,
    status: rec.status,
    customer_name: rec.customerName,
    phone: rec.phone,
    vehicle: rec.vehicle,
    service: rec.service,
    location: rec.location,
    appointment_date: rec.date || null,
    appointment_time: rec.time || null,
    lang: rec.lang,
    data: rec.data,
  };
}

// ── CRUD (async, Supabase-backed) ─────────────────────────────
export async function saveBooking(data, meta = {}) {
  const record = buildRecord(data, meta);

  if (supabaseConfigured) {
    const { error } = await supabase
      .from(BOOKINGS_TABLE)
      .insert(recordToRow(record));
    if (error) {
      const err = new Error(error.message || 'Failed to save booking.');
      err.code = error.code;
      throw err;
    }
  } else {
    // No Supabase → fall back to localStorage only
    writeLocalBookings([record, ...getLocalBookings()]);
    return record;
  }

  // Mirror to localStorage for offline read
  try { writeLocalBookings([record, ...getLocalBookings()]); } catch {}
  return record;
}

export async function getBookings() {
  if (supabaseConfigured) {
    const { data, error } = await supabase
      .from(BOOKINGS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      const err = new Error(error.message || 'Failed to load bookings.');
      err.code = error.code;
      throw err;
    }
    const list = (data || []).map(rowToRecord);
    try { writeLocalBookings(list); } catch {}
    return list;
  }
  return getLocalBookings();
}

export async function updateBookingStatus(id, status) {
  if (!STATUSES.includes(status)) return;

  if (supabaseConfigured) {
    const { error } = await supabase
      .from(BOOKINGS_TABLE)
      .update({ status })
      .eq('id', id);
    if (error) {
      const err = new Error(error.message || 'Failed to update status.');
      err.code = error.code;
      throw err;
    }
  }

  // Mirror locally
  try {
    const list = getLocalBookings().map(b => (b.id === id ? { ...b, status } : b));
    writeLocalBookings(list);
  } catch {}
}

export async function deleteBooking(id) {
  if (supabaseConfigured) {
    const { error } = await supabase
      .from(BOOKINGS_TABLE)
      .delete()
      .eq('id', id);
    if (error) {
      const err = new Error(error.message || 'Failed to delete booking.');
      err.code = error.code;
      throw err;
    }
  }
  try { writeLocalBookings(getLocalBookings().filter(b => b.id !== id)); } catch {}
}

// ── Draft (in-progress form) — local only ─────────────────────
export function loadDraft() {
  if (!isBrowser()) return null;
  return safeParse(window.localStorage.getItem(DRAFT_KEY), null);
}

export function saveDraft(data, step) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step, savedAt: Date.now() }));
  } catch {}
}

export function clearDraft() {
  if (!isBrowser()) return;
  try { window.localStorage.removeItem(DRAFT_KEY); } catch {}
}

// ── WhatsApp message formatter ────────────────────────────────
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

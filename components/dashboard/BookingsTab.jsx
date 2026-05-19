'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search, Phone, MessageCircle, Mail, MapPin, Calendar, Clock, Car,
  FileText, Trash2, Download, ChevronDown, Check, Copy, ExternalLink,
  AlertTriangle, Filter, X, FileSpreadsheet, FileJson, Wrench,
} from 'lucide-react';
import {
  formatBookingMessage, updateBookingStatus, deleteBooking,
  STATUSES, PAYMENT_STATUSES, STATUS_LABELS, normalizeStatus,
} from '@/lib/bookings';
import { bookingJobTotals } from '@/lib/usedParts';
import { fmtEGP, isoToday } from '@/lib/format';
import {
  StatCard, SectionHeader, GhostButton, PrimaryButton, ConfirmModal, ErrorBanner, cx,
} from './ui';
import JobCostPanel from './JobCostPanel';

// Canonical statuses only. Legacy DB values are normalized to one of these on read.
const STATUS_STYLES = {
  new:           { label: STATUS_LABELS.new,            dot: '#FFB020', bg: 'bg-[#FFB020]/10', text: 'text-[#FFB020]', border: 'border-[#FFB020]/40' },
  confirmed:     { label: STATUS_LABELS.confirmed,      dot: '#06B6D4', bg: 'bg-[#06B6D4]/10', text: 'text-[#06B6D4]', border: 'border-[#06B6D4]/40' },
  in_progress:   { label: STATUS_LABELS.in_progress,    dot: '#3B82F6', bg: 'bg-[#3B82F6]/10', text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/40' },
  waiting_parts: { label: STATUS_LABELS.waiting_parts,  dot: '#A855F7', bg: 'bg-[#A855F7]/10', text: 'text-[#A855F7]', border: 'border-[#A855F7]/40' },
  ready:         { label: STATUS_LABELS.ready,          dot: '#25D366', bg: 'bg-[#25D366]/10', text: 'text-[#25D366]', border: 'border-[#25D366]/40' },
  delivered:     { label: STATUS_LABELS.delivered,      dot: '#FFFFFF', bg: 'bg-white/10',     text: 'text-white',     border: 'border-white/30' },
  cancelled:     { label: STATUS_LABELS.cancelled,      dot: '#E10600', bg: 'bg-[#E10600]/10', text: 'text-[#E10600]', border: 'border-[#E10600]/40' },
};

const PAYMENT_STATUS_COLORS = {
  unpaid: '#FFB020',
  partial: '#3B82F6',
  paid: '#25D366',
};

const WA_BASE = 'https://wa.me/';

// ── CSV helpers ───────────────────────────────────────────────
function csvField(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function bookingsToCsv(rows) {
  const cols = [
    ['Reference', b => b.id],
    ['Created', b => new Date(b.createdAt).toISOString()],
    ['Status', b => b.status],
    ['Payment Status', b => b.paymentStatus],
    ['Customer Name', b => b.customerName],
    ['Phone', b => b.phone],
    ['Vehicle', b => b.vehicle],
    ['Service', b => b.service],
    ['Appointment Date', b => b.date],
    ['Appointment Time', b => b.time],
    ['Location', b => b.location],
    ['Invoice Total', b => b._totals.totalInvoice],
    ['Parts Cost', b => b._totals.totalPartsCost],
    ['Parts Profit', b => b._totals.totalPartsProfit],
    ['Labor', b => b._totals.laborSellingPrice],
    ['Discount', b => b._totals.discount],
    ['Gross Profit', b => b._totals.grossProfit],
    ['Amount Paid', b => b._totals.amountPaid],
    ['Amount Remaining', b => b._totals.amountRemaining],
    ['Payment Method', b => b.paymentMethod],
  ];
  const header = cols.map(c => c[0]).join(',');
  const lines = rows.map(b => cols.map(([, fn]) => csvField(fn(b))).join(','));
  return '﻿' + [header, ...lines].join('\r\n');
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildWhatsAppLink(booking) {
  const d = booking.data || {};
  const waNumber = ((d.whatsapp || d.phone || booking.phone || '').replace(/\D/g, ''));
  if (!waNumber) return null;
  const msg = encodeURIComponent(formatBookingMessage(booking, booking.lang === 'ar'));
  return `${WA_BASE}${waNumber}?text=${msg}`;
}

// ── Main tab ─────────────────────────────────────────────────
export default function BookingsTab({ bookings, usedParts, inventory, refresh, loadError, supabaseConfigured }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  // Pre-compute per-booking totals from used parts
  const enriched = useMemo(() => {
    const byBooking = new Map();
    for (const p of usedParts) {
      const list = byBooking.get(p.bookingId) || [];
      list.push(p);
      byBooking.set(p.bookingId, list);
    }
    return bookings.map(b => ({
      ...b,
      _parts: byBooking.get(b.id) || [],
      _totals: bookingJobTotals(b, byBooking.get(b.id) || []),
    }));
  }, [bookings, usedParts]);

  const stats = useMemo(() => {
    const today = isoToday();
    return {
      total: enriched.length,
      today: enriched.filter(b => b.date === today && b.status !== 'cancelled').length,
      unpaid: enriched.reduce((s, b) => s + (b.status === 'cancelled' ? 0 : b._totals.amountRemaining), 0),
      invoice: enriched.reduce((s, b) => s + (b.status === 'cancelled' ? 0 : b._totals.totalInvoice), 0),
    };
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && b.paymentStatus !== paymentFilter) return false;
      if (datePreset === 'today' && b.date !== isoToday()) return false;
      if (datePreset === 'upcoming' && b.date < isoToday()) return false;
      if (datePreset === 'custom' && dateFilter && b.date !== dateFilter) return false;
      if (!q) return true;
      const d = b.data || {};
      const hay = [b.id, b.customerName, b.phone, d.whatsapp, d.email,
        b.vehicle, d.brand, d.model, d.vin, b.service, d.description,
        d.address, b.date, b.time, (d.quickServices || []).join(' ')
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [enriched, query, statusFilter, paymentFilter, datePreset, dateFilter]);

  const activeFilters = statusFilter !== 'all' || paymentFilter !== 'all' || datePreset !== 'all' || !!query;

  const clearFilters = () => {
    setQuery(''); setStatusFilter('all'); setPaymentFilter('all');
    setDatePreset('all'); setDateFilter('');
  };

  const onStatusChange = async (id, status) => {
    setActionError('');
    try {
      await updateBookingStatus(id, status);
      await refresh();
    } catch (e) {
      setActionError(e?.message || 'Failed to update status.');
    }
  };

  const onDelete = async (id) => {
    setActionError('');
    setConfirmDelete(null);
    if (expanded === id) setExpanded(null);
    try {
      await deleteBooking(id);
      await refresh();
    } catch (e) {
      setActionError(e?.message || 'Failed to delete.');
    }
  };

  const handleExportCsv = () => {
    const data = filtered.length ? filtered : enriched;
    downloadFile(bookingsToCsv(data), `rosso-bookings-${isoToday()}.csv`, 'text/csv;charset=utf-8;');
    setExportOpen(false);
  };

  const handleExportJson = () => {
    const data = filtered.length ? filtered : enriched;
    downloadFile(JSON.stringify(data, null, 2), `rosso-bookings-${isoToday()}.json`, 'application/json');
    setExportOpen(false);
  };

  // Close export dropdown
  React.useEffect(() => {
    if (!exportOpen) return;
    const h = () => setExportOpen(false);
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, [exportOpen]);

  return (
    <>
      <SectionHeader
        eyebrow="BOOKINGS"
        title="Bookings & Jobs"
        subtitle="Every reservation, with job cost, parts used and payment tracking."
        right={
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <GhostButton onClick={() => setExportOpen(o => !o)} disabled={enriched.length === 0}>
              <Download size={12} /> Export <ChevronDown size={11} className={cx('transition-transform', exportOpen && 'rotate-180')} />
            </GhostButton>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 min-w-[200px] bg-[#0F0F0F] border border-white/10 shadow-2xl z-10">
                <button onClick={handleExportCsv} className="w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest text-white/80 hover:bg-[#E10600]/10 hover:text-white border-b border-white/5">
                  <FileSpreadsheet size={14} className="text-[#25D366]" />
                  <div className="flex flex-col items-start gap-0.5">
                    <span>CSV</span>
                    <span className="text-[9px] text-white/40 normal-case tracking-normal">{filtered.length} {filtered.length === 1 ? 'booking' : 'bookings'}</span>
                  </div>
                </button>
                <button onClick={handleExportJson} className="w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest text-white/80 hover:bg-[#E10600]/10 hover:text-white">
                  <FileJson size={14} className="text-[#3B82F6]" />
                  <div className="flex flex-col items-start gap-0.5">
                    <span>JSON</span>
                    <span className="text-[9px] text-white/40 normal-case tracking-normal">{filtered.length} {filtered.length === 1 ? 'booking' : 'bookings'}</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 border-y border-white/10 mb-6">
        <StatCard label="Total" value={stats.total} accent="#FFFFFF" />
        <StatCard label="Today" value={stats.today} accent="#E10600" highlight />
        <StatCard label="Invoice value" value={fmtEGP(stats.invoice)} accent="#3B82F6" />
        <StatCard label="Unpaid" value={fmtEGP(stats.unpaid)} accent="#FFB020" />
      </div>

      {/* Filters */}
      <div className="mb-6 bg-gradient-to-br from-[#0F0F0F] to-[#0A0A0A] border border-white/10 p-4 space-y-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                 placeholder="Search by name, phone, vehicle, VIN, or reference..."
                 className="w-full bg-black/40 border border-white/10 focus:border-[#E10600] outline-none py-2.5 pl-9 pr-10 text-sm placeholder-white/30 transition-colors" />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5">Status</div>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>All</Chip>
              {STATUSES.map(s => (
                <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} dot={STATUS_STYLES[s]?.dot}>
                  {STATUS_STYLES[s]?.label || s}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5">Payment</div>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={paymentFilter === 'all'} onClick={() => setPaymentFilter('all')}>All</Chip>
              {PAYMENT_STATUSES.map(p => (
                <Chip key={p} active={paymentFilter === p} onClick={() => setPaymentFilter(p)} dot={PAYMENT_STATUS_COLORS[p]}>
                  {p}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5">Appointment</div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip active={datePreset === 'all'} onClick={() => { setDatePreset('all'); setDateFilter(''); }}>Any</Chip>
              <Chip active={datePreset === 'today'} onClick={() => { setDatePreset('today'); setDateFilter(''); }}>Today</Chip>
              <Chip active={datePreset === 'upcoming'} onClick={() => { setDatePreset('upcoming'); setDateFilter(''); }}>Upcoming</Chip>
              <div className={cx('inline-flex items-center gap-2 border transition-all', datePreset === 'custom' ? 'border-[#E10600] bg-[#E10600]/15' : 'border-white/10 bg-black/30 hover:border-white/30')}>
                <input type="date" value={dateFilter}
                       onChange={(e) => { const v = e.target.value; setDateFilter(v); setDatePreset(v ? 'custom' : 'all'); }}
                       className="bg-transparent outline-none px-2 py-1 text-[11px] mono-font text-white"
                       style={{ colorScheme: 'dark' }} />
              </div>
            </div>
          </div>
        </div>

        {activeFilters && (
          <div className="flex items-center justify-between text-[11px] uppercase tracking-widest pt-3 border-t border-white/5">
            <span className="text-white/40">
              <span className="text-white/80">{filtered.length}</span> of <span className="text-white/80">{enriched.length}</span>
            </span>
            <button onClick={clearFilters} className="text-white/60 hover:text-[#E10600] flex items-center gap-1.5">
              <X size={11} /> Clear filters
            </button>
          </div>
        )}
      </div>

      {actionError && <div className="mb-4"><ErrorBanner>{actionError}</ErrorBanner></div>}
      {loadError && (
        <div className="mb-4">
          <ErrorBanner onRetry={refresh}>
            <div className="font-bold mb-1">Could not reach the database</div>
            <div className="text-white/70 text-xs">{loadError}</div>
            {!supabaseConfigured && (
              <div className="text-white/60 text-xs mt-1">
                Supabase not configured — set <code className="mono-font">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="mono-font">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
              </div>
            )}
          </ErrorBanner>
        </div>
      )}

      {enriched.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <NoResults onClear={clearFilters} />
      ) : (
        <div className="space-y-2.5">
          {filtered.map(b => (
            <BookingCard key={b.id} booking={b} inventory={inventory} usedParts={usedParts} refresh={refresh}
                         expanded={expanded === b.id}
                         onToggle={() => setExpanded(expanded === b.id ? null : b.id)}
                         onStatusChange={(s) => onStatusChange(b.id, s)}
                         onDelete={() => setConfirmDelete(b.id)} />
          ))}
        </div>
      )}

      <ConfirmModal open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
                    onConfirm={() => onDelete(confirmDelete)}
                    title="Delete booking?"
                    message="This will permanently remove the booking and its used parts. Stock used on this booking will be returned to inventory by the cascade, but used-part rows are also deleted — verify stock if needed." />
    </>
  );
}

// ── Card ─────────────────────────────────────────────────────
function BookingCard({ booking, inventory, usedParts, refresh, expanded, onToggle, onStatusChange, onDelete }) {
  const s = STATUS_STYLES[booking.status] || STATUS_STYLES.new;
  const d = booking.data || {};
  const createdAt = new Date(booking.createdAt);
  const phoneDigits = (booking.phone || d.phone || '').replace(/\D/g, '');
  const whatsappLink = buildWhatsAppLink(booking);
  const tot = booking._totals;
  const pColor = PAYMENT_STATUS_COLORS[booking.paymentStatus] || '#FFFFFF';

  const [copied, setCopied] = useState(false);
  const copyRef = (e) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(booking.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className={cx(
      'bg-gradient-to-br from-[#121212] to-[#0A0A0A] border transition-all anim-fade-up overflow-hidden',
      expanded ? 'border-[#E10600]/40 shadow-[0_0_30px_-12px_rgba(225,6,0,0.4)]' : 'border-white/10 hover:border-white/25'
    )}>
      <div className="flex">
        <button aria-label="Toggle details" onClick={onToggle}
                className="w-1.5 shrink-0 self-stretch" style={{ background: s.dot }} />
        <button onClick={onToggle} className="flex-1 min-w-0 text-start px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="mono-font text-[11px] text-[#E10600] truncate">{booking.id}</span>
              <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-white/30">
                · {createdAt.toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={cx('inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-widest border', s.bg, s.text, s.border)}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                {s.label}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-widest border" style={{ borderColor: `${pColor}55`, color: pColor }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: pColor }} />
                {booking.paymentStatus}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3 mb-2 min-w-0">
            <div className="text-base md:text-lg text-white truncate font-medium">{booking.customerName || d.name || '—'}</div>
            <div className="text-xs md:text-sm text-white/40 truncate">{booking.vehicle || `${d.brand || ''} ${d.model || ''}`.trim()}</div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] md:text-xs text-white/50">
            <span className="inline-flex items-center gap-1.5"><Phone size={11} className="text-white/30" /><span className="mono-font" dir="ltr">{booking.phone || d.phone || '—'}</span></span>
            {(booking.date || booking.time) && (
              <span className="inline-flex items-center gap-1.5"><Calendar size={11} className="text-white/30" /><span className="mono-font">{booking.date || '—'}{booking.time ? ` · ${booking.time}` : ''}</span></span>
            )}
            <span className="inline-flex items-center gap-1.5"><MapPin size={11} className="text-white/30" /><span>{d.locationType === 'mobile' ? 'Mobile' : 'Center'}</span></span>
          </div>

          {/* Financial row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-widest mt-2 pt-2 border-t border-white/5">
            <span className="text-white/30">Invoice <span className="mono-font text-white/80 normal-case tracking-normal">{fmtEGP(tot.totalInvoice)}</span></span>
            <span className="text-white/30">Paid <span className="mono-font text-[#25D366] normal-case tracking-normal">{fmtEGP(tot.amountPaid)}</span></span>
            <span className="text-white/30">Remaining <span className="mono-font text-[#FFB020] normal-case tracking-normal">{fmtEGP(tot.amountRemaining)}</span></span>
            <span className="text-white/30">Profit <span className="mono-font text-[#25D366] normal-case tracking-normal">{fmtEGP(tot.grossProfit)}</span></span>
          </div>
        </button>

        <div className="flex items-stretch shrink-0 border-l border-white/5">
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
               aria-label="Send WhatsApp" title="Open WhatsApp with booking details"
               className="w-12 md:w-14 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/15 transition-colors">
              <MessageCircle size={18} />
            </a>
          )}
          <button onClick={onToggle} aria-label="Toggle details"
                  className="w-10 md:w-12 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.04] border-l border-white/5 transition-colors">
            <ChevronDown size={16} className={cx('transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-4 md:px-6 py-5 md:py-7 anim-fade-up space-y-7">
          {/* Customer actions */}
          <ActionGroup label="Customer actions">
            {phoneDigits && (
              <ActionButton href={`tel:${booking.phone || d.phone}`} icon={<Phone size={12} />} label="Call" />
            )}
            {whatsappLink && (
              <ActionButton href={whatsappLink} icon={<MessageCircle size={12} />} label="WhatsApp"
                            external variant="whatsapp" />
            )}
            {d.email && (
              <ActionButton href={`mailto:${d.email}`} icon={<Mail size={12} />} label="Email" />
            )}
            {d.mapsLink && (
              <ActionButton href={d.mapsLink} icon={<MapPin size={12} />} label="Map" external />
            )}
            <ActionButton onClick={copyRef} icon={copied ? <Check size={12} /> : <Copy size={12} />}
                          label={copied ? 'Copied' : 'Copy ref'} />
          </ActionGroup>

          {/* Status switcher — clean responsive grid, consistent button sizing */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
              <span>Job status</span>
              <span className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
              {STATUSES.map(st => {
                const ss = STATUS_STYLES[st];
                const active = booking.status === st;
                const danger = st === 'cancelled';
                return (
                  <button key={st} onClick={(e) => { e.stopPropagation(); onStatusChange(st); }}
                          className={cx(
                            'h-9 inline-flex items-center justify-center gap-2 px-2.5 text-[10px] uppercase tracking-widest border transition-all',
                            active
                              ? cx(ss.bg, ss.text, ss.border, 'font-bold')
                              : danger
                                ? 'border-white/10 text-white/40 hover:border-[#E10600]/60 hover:bg-[#E10600]/10 hover:text-[#E10600]'
                                : 'border-white/10 text-white/55 hover:border-white/30 hover:text-white'
                          )}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ss.dot }} />
                    <span className="truncate">{ss.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer / vehicle / appt / service details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm">
            <Group title="Customer" icon={<FileText size={11} />}>
              <Row label="Name" value={booking.customerName || d.name} />
              <Row label="Phone" value={booking.phone || d.phone} mono />
              <Row label="WhatsApp" value={d.whatsapp} mono />
              <Row label="Email" value={d.email} />
            </Group>
            <Group title="Vehicle" icon={<Car size={11} />}>
              <Row label="Brand" value={d.brand} />
              <Row label="Model" value={d.model} />
              <Row label="VIN" value={d.vin} mono />
            </Group>
            <Group title="Appointment" icon={<Calendar size={11} />}>
              <Row label="Date" value={booking.date} mono />
              <Row label="Time" value={booking.time} mono />
              <Row label="Location" value={booking.location || (d.locationType === 'mobile' ? 'Mobile / Home Service' : 'Service Center Visit')} />
              {d.locationType === 'mobile' && (<>
                <Row label="Address" value={d.address} />
                <Row label="Notes" value={d.locNotes} multiline />
              </>)}
            </Group>
            <Group title="Service" icon={<Clock size={11} />}>
              {d.quickServices?.length > 0 && <Row label="Quick" value={d.quickServices.join(', ')} multiline />}
              {d.description && <Row label="Details" value={d.description} multiline />}
              {!d.description && !d.quickServices?.length && (
                <div className="text-white/30 text-xs italic">No service notes</div>
              )}
            </Group>
          </div>

          {/* Job Cost panel */}
          <div className="border-t border-[#E10600]/30 pt-6">
            <div className="flex items-center gap-2 mb-4 text-[11px] uppercase tracking-widest text-[#E10600] font-bold">
              <Wrench size={12} />
              Job cost &amp; invoice
            </div>
            <JobCostPanel booking={booking} usedParts={usedParts} inventory={inventory} refresh={refresh} />
          </div>

          {/* Danger zone */}
          <div className="pt-4 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Danger zone</div>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="inline-flex items-center gap-2 h-9 px-3 border border-[#E10600]/40 text-[#E10600] hover:bg-[#E10600] hover:text-white text-[11px] uppercase tracking-widest font-bold transition-all">
              <Trash2 size={12} /> Delete booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Consistent action button — used inside grouped action rows.
function ActionButton({ href, onClick, icon, label, variant = 'default', external }) {
  const cls = variant === 'whatsapp'
    ? 'bg-[#25D366] hover:bg-[#1ebd57] text-white border border-[#25D366]'
    : variant === 'primary'
      ? 'bg-[#E10600] hover:bg-[#FF1A0F] text-white border border-[#E10600]'
      : 'border border-white/15 text-white/80 hover:border-[#E10600] hover:bg-[#E10600]/10 hover:text-white';
  const common = cx('inline-flex items-center justify-center gap-2 h-9 px-3 text-[11px] uppercase tracking-widest font-medium transition-all', cls);
  if (href) {
    return (
      <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}
         onClick={(e) => e.stopPropagation()} className={common}>
        {icon} <span className="hidden xs:inline">{label}</span><span className="xs:hidden">{label}</span>
      </a>
    );
  }
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick?.(e); }} className={common}>
      {icon} {label}
    </button>
  );
}

function ActionGroup({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
        <span>{label}</span>
        <span className="h-px flex-1 bg-white/5" />
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
export { ActionButton, ActionGroup };

function Chip({ active, onClick, children, dot }) {
  return (
    <button onClick={onClick}
            className={cx(
              'shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] uppercase tracking-widest border transition-all',
              active ? 'border-[#E10600] bg-[#E10600]/15 text-white'
                     : 'border-white/10 bg-black/30 text-white/60 hover:border-white/30 hover:text-white'
            )}>
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />}
      {children}
    </button>
  );
}

function Group({ title, icon, children }) {
  return (
    <div className="bg-black/30 border border-white/5 p-4">
      <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-widest text-[#E10600]">
        {icon}<span>{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, mono, multiline }) {
  if (!value) return null;
  return (
    <div className={cx('flex gap-3', multiline ? 'flex-col gap-1' : 'justify-between items-baseline')}>
      <span className="text-[10px] uppercase tracking-widest text-white/40 shrink-0">{label}</span>
      <span className={cx('text-white/90 break-words', mono ? 'mono-font text-xs' : 'text-sm', !multiline && 'text-end')} dir={mono ? 'ltr' : undefined}>
        {value}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-white/10 px-6 py-14 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#E10600]" />
      <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-[#E10600]" />
      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-[#E10600]" />
      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#E10600]" />
      <div className="inline-flex items-center justify-center w-14 h-14 bg-[#E10600]/10 border border-[#E10600]/30 mb-4">
        <FileText size={22} className="text-[#E10600]" strokeWidth={1.5} />
      </div>
      <h2 className="display-font text-xl md:text-2xl uppercase">No bookings yet</h2>
      <p className="text-white/50 mt-2 max-w-md mx-auto text-sm">Bookings submitted via the booking form on the homepage will show up here.</p>
      <Link href="/#booking" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-[#E10600] hover:bg-[#FF1A0F] text-white text-xs uppercase tracking-widest font-bold transition-all">
        Open booking form <ExternalLink size={12} />
      </Link>
    </div>
  );
}

function NoResults({ onClear }) {
  return (
    <div className="bg-black/30 border border-white/10 px-6 py-12 text-center">
      <FileText size={20} className="text-white/30 mx-auto mb-3" strokeWidth={1.5} />
      <p className="text-white/60 mb-4 text-sm">No bookings match your filters.</p>
      <button onClick={onClear} className="inline-flex items-center gap-2 px-4 py-2 border border-white/15 hover:border-[#E10600] text-xs uppercase tracking-widest transition-all">
        <X size={12} /> Clear filters
      </button>
    </div>
  );
}

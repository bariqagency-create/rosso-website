'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Phone, MessageCircle, Mail, MapPin, Calendar, Clock,
  Car, FileText, Trash2, Download, ChevronDown, Check, Copy, ExternalLink,
  LayoutDashboard, AlertTriangle, Filter, X, FileSpreadsheet, FileJson
} from 'lucide-react';
import {
  getBookings, updateBookingStatus, deleteBooking, formatBookingMessage, STATUSES
} from '@/lib/bookings';

const STATUS_STYLES = {
  pending:   { label: 'Pending',   dot: '#FFB020', bg: 'bg-[#FFB020]/10', text: 'text-[#FFB020]', border: 'border-[#FFB020]/40' },
  confirmed: { label: 'Confirmed', dot: '#3B82F6', bg: 'bg-[#3B82F6]/10', text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/40' },
  completed: { label: 'Completed', dot: '#25D366', bg: 'bg-[#25D366]/10', text: 'text-[#25D366]', border: 'border-[#25D366]/40' },
  cancelled: { label: 'Cancelled', dot: '#E10600', bg: 'bg-[#E10600]/10', text: 'text-[#E10600]', border: 'border-[#E10600]/40' },
};

const WA_BASE = 'https://wa.me/';

const classes = (...c) => c.filter(Boolean).join(' ');
const isoToday = () => new Date().toISOString().split('T')[0];

// ── CSV helpers ───────────────────────────────────────────────
const CSV_COLUMNS = [
  ['Reference', b => b.id],
  ['Created', b => new Date(b.createdAt).toISOString()],
  ['Status', b => b.status],
  ['Language', b => b.lang || 'en'],
  ['Name', b => b.data?.name],
  ['Phone', b => b.data?.phone],
  ['WhatsApp', b => b.data?.whatsapp],
  ['Email', b => b.data?.email],
  ['Brand', b => b.data?.brand],
  ['Model', b => b.data?.model],
  ['VIN', b => b.data?.vin],
  ['Appointment Date', b => b.data?.date],
  ['Appointment Time', b => b.data?.time],
  ['Location Type', b => b.data?.locationType],
  ['Address', b => b.data?.address],
  ['Maps Link', b => b.data?.mapsLink],
  ['Location Notes', b => b.data?.locNotes],
  ['Quick Services', b => (b.data?.quickServices || []).join('; ')],
  ['Description', b => b.data?.description],
  ['Needs Spare', b => (b.data?.needsSpare === true ? 'Yes' : b.data?.needsSpare === false ? 'No' : '')],
  ['Spare Part Name', b => b.data?.sparePart?.name],
  ['Spare Part Description', b => b.data?.sparePart?.desc],
  ['Spare Part Notes', b => b.data?.sparePart?.notes],
];

function escapeCsvField(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function bookingsToCsv(list) {
  const header = CSV_COLUMNS.map(c => c[0]).join(',');
  const rows = list.map(b => CSV_COLUMNS.map(([, fn]) => escapeCsvField(fn(b))).join(','));
  return '﻿' + [header, ...rows].join('\r\n');
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

// ── Main component ────────────────────────────────────────────
export default function BookingsDashboard() {
  const [bookings, setBookings] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(''); // YYYY-MM-DD or ''
  const [datePreset, setDatePreset] = useState('all'); // 'all' | 'today' | 'upcoming' | 'custom'
  const [expanded, setExpanded] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setBookings(getBookings());
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('rosso:bookings-changed', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('rosso:bookings-changed', refresh);
    };
  }, []);

  // Close export dropdown when clicking outside
  useEffect(() => {
    if (!exportOpen) return;
    const handler = () => setExportOpen(false);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [exportOpen]);

  const stats = useMemo(() => {
    const today = isoToday();
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      today: bookings.filter(b => b.data?.date === today && b.status !== 'cancelled').length,
    };
  }, [bookings]);

  const dateMatches = (b) => {
    const apptDate = b.data?.date || '';
    if (datePreset === 'today') return apptDate === isoToday();
    if (datePreset === 'upcoming') return apptDate >= isoToday();
    if (datePreset === 'custom' && dateFilter) return apptDate === dateFilter;
    return true;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (!dateMatches(b)) return false;
      if (!q) return true;
      const d = b.data || {};
      const haystack = [
        b.id, d.name, d.phone, d.whatsapp, d.email,
        d.brand, d.model, d.vin, d.description,
        d.address, d.date, d.time,
        (d.quickServices || []).join(' ')
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [bookings, query, statusFilter, datePreset, dateFilter]);

  const activeFilters = (statusFilter !== 'all') || datePreset !== 'all' || !!query;

  const onStatusChange = (id, status) => {
    updateBookingStatus(id, status);
    setBookings(getBookings());
  };

  const onDelete = (id) => {
    deleteBooking(id);
    setBookings(getBookings());
    setConfirmDelete(null);
    if (expanded === id) setExpanded(null);
  };

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
    setDatePreset('all');
    setDateFilter('');
  };

  const handleExportCsv = () => {
    const data = filtered.length ? filtered : bookings;
    downloadFile(bookingsToCsv(data), `rosso-bookings-${isoToday()}.csv`, 'text/csv;charset=utf-8;');
    setExportOpen(false);
  };

  const handleExportJson = () => {
    const data = filtered.length ? filtered : bookings;
    downloadFile(JSON.stringify(data, null, 2), `rosso-bookings-${isoToday()}.json`, 'application/json');
    setExportOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#E10600] selection:text-white"
         style={{ fontFamily: "'Archivo', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/85 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 h-16 md:h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors group min-w-0">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform shrink-0" />
            <span className="text-xs uppercase tracking-[0.2em] truncate">Back to site</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
            <LayoutDashboard size={14} className="text-[#E10600]" />
            <span>Bookings</span>
          </div>

          {/* Export dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setExportOpen(o => !o)}
              disabled={bookings.length === 0}
              className="inline-flex items-center gap-2 px-3 md:px-4 py-2 border border-white/15 hover:border-[#E10600] hover:bg-[#E10600]/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs uppercase tracking-widest transition-all">
              <Download size={12} />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown size={12} className={classes('transition-transform', exportOpen && 'rotate-180')} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 min-w-[200px] bg-[#0F0F0F] border border-white/10 shadow-2xl anim-fade-up">
                <button onClick={handleExportCsv}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest text-white/80 hover:bg-[#E10600]/10 hover:text-white transition-colors border-b border-white/5">
                  <FileSpreadsheet size={14} className="text-[#25D366]" />
                  <div className="flex flex-col items-start gap-0.5">
                    <span>CSV</span>
                    <span className="text-[9px] text-white/40 normal-case tracking-normal">{filtered.length} {filtered.length === 1 ? 'booking' : 'bookings'}</span>
                  </div>
                </button>
                <button onClick={handleExportJson}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest text-white/80 hover:bg-[#E10600]/10 hover:text-white transition-colors">
                  <FileJson size={14} className="text-[#3B82F6]" />
                  <div className="flex flex-col items-start gap-0.5">
                    <span>JSON</span>
                    <span className="text-[9px] text-white/40 normal-case tracking-normal">{filtered.length} {filtered.length === 1 ? 'booking' : 'bookings'}</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-10 py-8 md:py-14">
        {/* Title */}
        <div className="mb-8 md:mb-12">
          <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-[#E10600] font-bold">— DASHBOARD</span>
          <h1 className="display-font text-3xl sm:text-4xl md:text-6xl uppercase mt-3 md:mt-4 leading-[0.95]">Bookings</h1>
          <p className="text-white/50 mt-3 max-w-xl text-sm md:text-base">
            Every reservation submitted through the ROSSO platform — searchable, filterable, and ready to action.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-white/10 border-y border-white/10 mb-8 md:mb-10">
          <StatCell label="Total" value={stats.total} accent="#FFFFFF" />
          <StatCell label="Pending" value={stats.pending} accent="#FFB020" />
          <StatCell label="Confirmed" value={stats.confirmed} accent="#3B82F6" />
          <StatCell label="Completed" value={stats.completed} accent="#25D366" />
          <StatCell label="Today" value={stats.today} accent="#E10600" highlight />
        </div>

        {/* Filters */}
        <div className="mb-6 md:mb-8 bg-gradient-to-br from-[#0F0F0F] to-[#0A0A0A] border border-white/10">
          <div className="p-4 md:p-5 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, phone, model, VIN, or reference..."
                className="w-full bg-black/40 border border-white/10 focus:border-[#E10600] outline-none py-3 pl-11 pr-10 text-sm placeholder-white/30 transition-colors"
              />
              {query && (
                <button onClick={() => setQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status + Date filters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest text-white/40">
                  <Filter size={11} />
                  <span>Status</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
                    All
                  </FilterChip>
                  {STATUSES.map(s => (
                    <FilterChip key={s} active={statusFilter === s}
                                onClick={() => setStatusFilter(s)}
                                dot={STATUS_STYLES[s].dot}>
                      {STATUS_STYLES[s].label}
                    </FilterChip>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest text-white/40">
                  <Calendar size={11} />
                  <span>Appointment date</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <FilterChip active={datePreset === 'all'} onClick={() => { setDatePreset('all'); setDateFilter(''); }}>
                    Any
                  </FilterChip>
                  <FilterChip active={datePreset === 'today'} onClick={() => { setDatePreset('today'); setDateFilter(''); }}>
                    Today
                  </FilterChip>
                  <FilterChip active={datePreset === 'upcoming'} onClick={() => { setDatePreset('upcoming'); setDateFilter(''); }}>
                    Upcoming
                  </FilterChip>
                  <div className={classes(
                    'inline-flex items-center gap-2 border transition-all',
                    datePreset === 'custom'
                      ? 'border-[#E10600] bg-[#E10600]/15'
                      : 'border-white/10 bg-black/30 hover:border-white/30'
                  )}>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDateFilter(v);
                        setDatePreset(v ? 'custom' : 'all');
                      }}
                      className="bg-transparent outline-none px-3 py-1.5 text-[11px] mono-font text-white"
                      style={{ colorScheme: 'dark' }}
                    />
                    {dateFilter && (
                      <button onClick={() => { setDateFilter(''); setDatePreset('all'); }}
                              className="pr-2 text-white/40 hover:text-white">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {activeFilters && (
              <div className="flex items-center justify-between text-[11px] uppercase tracking-widest pt-3 border-t border-white/5">
                <span className="text-white/40">
                  <span className="text-white/80">{filtered.length}</span> of <span className="text-white/80">{bookings.length}</span> {bookings.length === 1 ? 'booking' : 'bookings'}
                </span>
                <button onClick={clearFilters}
                        className="text-white/60 hover:text-[#E10600] transition-colors flex items-center gap-1.5">
                  <X size={11} />
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* List */}
        {bookings.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <NoResults onClear={clearFilters} />
        ) : (
          <div className="space-y-2.5">
            {filtered.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                expanded={expanded === b.id}
                onToggle={() => setExpanded(expanded === b.id ? null : b.id)}
                onStatusChange={(s) => onStatusChange(b.id, s)}
                onDelete={() => setConfirmDelete(b.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-sm anim-fade-up"
             onClick={() => setConfirmDelete(null)}>
          <div className="bg-[#0F0F0F] border border-white/10 max-w-md w-full p-6 md:p-8 relative"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-[#E10600]/10 border border-[#E10600]/40 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-[#E10600]" />
              </div>
              <div>
                <h3 className="display-font text-xl uppercase mb-2">Delete booking?</h3>
                <p className="text-white/60 text-sm">This will permanently remove the record from your device. This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                      className="flex-1 py-3 border border-white/15 hover:border-white/40 text-xs uppercase tracking-widest">
                Cancel
              </button>
              <button onClick={() => onDelete(confirmDelete)}
                      className="flex-1 py-3 bg-[#E10600] hover:bg-[#FF1A0F] text-white text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function StatCell({ label, value, accent, highlight }) {
  return (
    <div className={classes(
      'bg-[#0A0A0A] px-4 md:px-5 py-5 md:py-7 flex flex-col gap-1.5 transition-colors',
      highlight ? 'bg-[#E10600]/5' : 'hover:bg-white/[0.02]'
    )}>
      <span className="mono-font text-2xl md:text-4xl leading-none" style={{ color: accent }}>{value}</span>
      <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-white/40">{label}</span>
    </div>
  );
}

function FilterChip({ active, onClick, children, dot }) {
  return (
    <button
      onClick={onClick}
      className={classes(
        'shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] md:text-[11px] uppercase tracking-widest border transition-all',
        active
          ? 'border-[#E10600] bg-[#E10600]/15 text-white'
          : 'border-white/10 bg-black/30 text-white/60 hover:border-white/30 hover:text-white'
      )}>
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />}
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-white/10 px-6 py-16 md:py-20 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#E10600]" />
      <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-[#E10600]" />
      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-[#E10600]" />
      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#E10600]" />

      <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E10600]/10 border border-[#E10600]/30 mb-6">
        <FileText size={26} className="text-[#E10600]" strokeWidth={1.5} />
      </div>
      <h2 className="display-font text-2xl md:text-3xl uppercase">No bookings yet</h2>
      <p className="text-white/50 mt-3 max-w-md mx-auto text-sm">
        Bookings submitted via the booking form on the homepage will show up here.
      </p>
      <Link href="/#booking"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-[#E10600] hover:bg-[#FF1A0F] text-white text-xs uppercase tracking-widest font-bold transition-all">
        Open booking form
        <ExternalLink size={12} />
      </Link>
    </div>
  );
}

function NoResults({ onClear }) {
  return (
    <div className="bg-black/30 border border-white/10 px-6 py-14 text-center">
      <FileText size={22} className="text-white/30 mx-auto mb-3" strokeWidth={1.5} />
      <p className="text-white/60 mb-4 text-sm">No bookings match your filters.</p>
      <button onClick={onClear}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/15 hover:border-[#E10600] text-xs uppercase tracking-widest transition-all">
        <X size={12} />
        Clear filters
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function buildWhatsAppLink(booking) {
  const d = booking.data || {};
  const waNumber = ((d.whatsapp || d.phone || '').replace(/\D/g, ''));
  if (!waNumber) return null;
  const msg = encodeURIComponent(formatBookingMessage(booking, booking.lang === 'ar'));
  return `${WA_BASE}${waNumber}?text=${msg}`;
}

function BookingCard({ booking, expanded, onToggle, onStatusChange, onDelete }) {
  const s = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
  const d = booking.data || {};
  const createdAt = new Date(booking.createdAt);
  const phoneDigits = (d.phone || '').replace(/\D/g, '');
  const whatsappLink = buildWhatsAppLink(booking);

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
    <div className={classes(
      'bg-gradient-to-br from-[#121212] to-[#0A0A0A] border transition-all anim-fade-up overflow-hidden',
      expanded ? 'border-[#E10600]/40 shadow-[0_0_30px_-12px_rgba(225,6,0,0.4)]' : 'border-white/10 hover:border-white/25'
    )}>
      {/* Header row — clickable to expand */}
      <div className="flex">
        {/* Status stripe */}
        <button
          aria-label="Toggle details"
          onClick={onToggle}
          className="w-1.5 shrink-0 self-stretch transition-colors"
          style={{ background: s.dot }} />

        <button
          onClick={onToggle}
          className="flex-1 min-w-0 text-start px-4 md:px-6 py-4 md:py-5">
          {/* Top line: ref + status + created (mobile shows ref/status, hides created) */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="mono-font text-[11px] text-[#E10600] truncate">{booking.id}</span>
              <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-white/30">
                · {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <span className={classes(
              'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-widest border shrink-0',
              s.bg, s.text, s.border
            )}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
              {s.label}
            </span>
          </div>

          {/* Main: name + vehicle */}
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3 mb-2 min-w-0">
            <div className="text-base md:text-lg text-white truncate font-medium">{d.name || '—'}</div>
            <div className="text-xs md:text-sm text-white/40 truncate">{d.brand} {d.model}</div>
          </div>

          {/* Meta: phone · appt · location */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] md:text-xs text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <Phone size={11} className="text-white/30" />
              <span className="mono-font" dir="ltr">{d.phone || '—'}</span>
            </span>
            {(d.date || d.time) && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={11} className="text-white/30" />
                <span className="mono-font">{d.date || '—'}{d.time ? ` · ${d.time}` : ''}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={11} className="text-white/30" />
              <span>{d.locationType === 'mobile' ? 'Mobile' : 'Center'}</span>
            </span>
          </div>
        </button>

        {/* Right action column — WhatsApp visible at all times */}
        <div className="flex items-stretch shrink-0 border-l border-white/5">
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label="Send WhatsApp"
              title="Open WhatsApp with booking details"
              className="w-12 md:w-14 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/15 transition-colors">
              <MessageCircle size={18} />
            </a>
          )}
          <button
            onClick={onToggle}
            aria-label="Toggle details"
            className="w-10 md:w-12 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.04] border-l border-white/5 transition-colors">
            <ChevronDown size={16} className={classes('transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-white/5 px-4 md:px-6 py-5 md:py-7 anim-fade-up">
          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {phoneDigits && (
              <a href={`tel:${d.phone}`} onClick={(e) => e.stopPropagation()}
                 className="inline-flex items-center gap-2 px-3 py-2 border border-white/15 hover:border-[#E10600] hover:bg-[#E10600]/10 text-[11px] uppercase tracking-widest transition-all">
                <Phone size={12} /> Call
              </a>
            )}
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                 className="inline-flex items-center gap-2 px-3 py-2 bg-[#25D366] hover:bg-[#1ebd57] text-white text-[11px] uppercase tracking-widest transition-all font-bold">
                <MessageCircle size={12} /> WhatsApp
              </a>
            )}
            {d.email && (
              <a href={`mailto:${d.email}`} onClick={(e) => e.stopPropagation()}
                 className="inline-flex items-center gap-2 px-3 py-2 border border-white/15 hover:border-[#E10600] hover:bg-[#E10600]/10 text-[11px] uppercase tracking-widest transition-all">
                <Mail size={12} /> Email
              </a>
            )}
            {d.mapsLink && (
              <a href={d.mapsLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                 className="inline-flex items-center gap-2 px-3 py-2 border border-white/15 hover:border-[#E10600] hover:bg-[#E10600]/10 text-[11px] uppercase tracking-widest transition-all">
                <MapPin size={12} /> Map
              </a>
            )}
            <button onClick={copyRef}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-white/15 hover:border-[#E10600] hover:bg-[#E10600]/10 text-[11px] uppercase tracking-widest transition-all">
              {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy ref'}
            </button>

            <div className="flex-1" />

            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-white/10 hover:border-[#E10600] hover:bg-[#E10600]/10 hover:text-[#E10600] text-white/50 text-[11px] uppercase tracking-widest transition-all">
              <Trash2 size={12} /> Delete
            </button>
          </div>

          {/* Status switcher */}
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Update status</div>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(st => {
                const ss = STATUS_STYLES[st];
                const active = booking.status === st;
                return (
                  <button key={st}
                          onClick={(e) => { e.stopPropagation(); onStatusChange(st); }}
                          className={classes(
                            'inline-flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-widest border transition-all',
                            active ? classes(ss.bg, ss.text, ss.border) : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white'
                          )}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: ss.dot }} />
                    {ss.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm">
            <DetailGroup title="Customer" icon={<FileText size={11} />}>
              <DetailRow label="Name" value={d.name} />
              <DetailRow label="Phone" value={d.phone} mono />
              <DetailRow label="WhatsApp" value={d.whatsapp} mono />
              <DetailRow label="Email" value={d.email} />
            </DetailGroup>

            <DetailGroup title="Vehicle" icon={<Car size={11} />}>
              <DetailRow label="Brand" value={d.brand} />
              <DetailRow label="Model" value={d.model} />
              <DetailRow label="VIN" value={d.vin} mono />
            </DetailGroup>

            <DetailGroup title="Appointment" icon={<Calendar size={11} />}>
              <DetailRow label="Date" value={d.date} mono />
              <DetailRow label="Time" value={d.time} mono />
              <DetailRow label="Location" value={d.locationType === 'mobile' ? 'Mobile / Home Service' : 'Service Center Visit'} />
              {d.locationType === 'mobile' && (
                <>
                  <DetailRow label="Address" value={d.address} />
                  <DetailRow label="Notes" value={d.locNotes} multiline />
                </>
              )}
            </DetailGroup>

            <DetailGroup title="Service" icon={<Clock size={11} />}>
              {d.quickServices?.length > 0 && (
                <DetailRow label="Quick" value={d.quickServices.join(', ')} multiline />
              )}
              {d.description && (
                <DetailRow label="Details" value={d.description} multiline />
              )}
              {d.needsSpare === true && (
                <DetailRow label="Spare part"
                           value={[d.sparePart?.name, d.sparePart?.desc, d.sparePart?.notes].filter(Boolean).join(' — ') || 'Requested'}
                           multiline />
              )}
              {!d.description && !d.quickServices?.length && d.needsSpare !== true && (
                <div className="text-white/30 text-xs italic">No service notes</div>
              )}
            </DetailGroup>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailGroup({ title, icon, children }) {
  return (
    <div className="bg-black/30 border border-white/5 p-4">
      <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-widest text-[#E10600]">
        {icon}
        <span>{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, mono, multiline }) {
  if (!value) return null;
  return (
    <div className={classes('flex gap-3', multiline ? 'flex-col gap-1' : 'justify-between items-baseline')}>
      <span className="text-[10px] uppercase tracking-widest text-white/40 shrink-0">{label}</span>
      <span className={classes(
        'text-white/90 break-words',
        mono ? 'mono-font text-xs' : 'text-sm',
        !multiline && 'text-end'
      )} dir={mono ? 'ltr' : undefined}>
        {value}
      </span>
    </div>
  );
}

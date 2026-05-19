'use client';

import React, { useMemo, useState } from 'react';
import { fmtEGP, isoToday, startOfWeek, startOfMonth, dateOnly } from '@/lib/format';
import { bookingJobTotals } from '@/lib/usedParts';
import { isLowStock } from '@/lib/inventory';
import { StatCard, SectionHeader, cx } from './ui';

function partsByBooking(usedParts) {
  const map = new Map();
  for (const p of usedParts) {
    const list = map.get(p.bookingId) || [];
    list.push(p);
    map.set(p.bookingId, list);
  }
  return map;
}

function inRange(dateStr, from, to) {
  if (!dateStr) return false;
  const d = dateOnly(dateStr);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export default function ReportsTab({ bookings, usedParts, inventory, expenses, salaries }) {
  const [preset, setPreset] = useState('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Resolve effective range
  const { effFrom, effTo } = useMemo(() => {
    const today = isoToday();
    if (preset === 'today') return { effFrom: today, effTo: today };
    if (preset === 'week') return { effFrom: startOfWeek().toISOString().split('T')[0], effTo: today };
    if (preset === 'month') return { effFrom: startOfMonth().toISOString().split('T')[0], effTo: today };
    if (preset === 'all') return { effFrom: '', effTo: '' };
    return { effFrom: from, effTo: to };
  }, [preset, from, to]);

  const report = useMemo(() => {
    const byBooking = partsByBooking(usedParts);

    // Bookings that fall in the range (use appointment date if present, else created_at)
    const inRangeBookings = bookings.filter(b => {
      if (!effFrom && !effTo) return true;
      const key = b.date || dateOnly(b.createdAt);
      return inRange(key, effFrom, effTo);
    });

    let revenue = 0, partsCost = 0, partsSell = 0, labor = 0, unpaid = 0;
    const partUsage = new Map(); // partName -> { qty, profit }
    const bookingProfit = [];

    for (const b of inRangeBookings) {
      const parts = byBooking.get(b.id) || [];
      const tot = bookingJobTotals(b, parts);
      if (b.status !== 'cancelled') {
        revenue += tot.totalInvoice;
        partsCost += tot.totalPartsCost;
        partsSell += tot.totalPartsSelling;
        labor += tot.laborSellingPrice;
        unpaid += tot.amountRemaining;
      }
      for (const p of parts) {
        const key = (p.partName || '—').trim();
        const cur = partUsage.get(key) || { qty: 0, sales: 0, profit: 0 };
        cur.qty += p.quantity;
        cur.sales += p.quantity * p.unitSellingPrice;
        cur.profit += p.quantity * (p.unitSellingPrice - p.unitCostPrice);
        partUsage.set(key, cur);
      }
      bookingProfit.push({ booking: b, profit: tot.grossProfit, invoice: tot.totalInvoice });
    }

    const filteredExpenses = expenses.filter(e => inRange(e.expenseDate, effFrom, effTo) || (!effFrom && !effTo));
    const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);

    // Salaries: match by salary_month YYYY-MM within range
    const filteredSalaries = salaries.filter(s => {
      if (!effFrom && !effTo) return true;
      const monthFromTo = (effFrom || '').slice(0, 7);
      const monthToTo = (effTo || '').slice(0, 7);
      if (effFrom && s.salaryMonth < monthFromTo) return false;
      if (effTo && s.salaryMonth > monthToTo) return false;
      return true;
    });
    const totalSalaries = filteredSalaries.reduce((s, x) => s + x.amount, 0);

    const partsProfit = partsSell - partsCost;
    const grossProfit = revenue - partsCost;
    const netProfit = grossProfit - totalExpenses - totalSalaries;

    const topParts = [...partUsage.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const topBookings = bookingProfit
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    return {
      revenue, partsCost, partsSell, partsProfit, labor,
      grossProfit, totalExpenses, totalSalaries, netProfit,
      unpaid, topParts, topBookings,
      lowStockCount: inventory.filter(isLowStock).length,
    };
  }, [bookings, usedParts, inventory, expenses, salaries, effFrom, effTo]);

  return (
    <>
      <SectionHeader eyebrow="REPORTS" title="Financial Report"
                     subtitle="Filter by date range. All numbers exclude cancelled bookings." />

      <div className="bg-gradient-to-br from-[#0F0F0F] to-[#0A0A0A] border border-white/10 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { v: 'today', label: 'Today' },
            { v: 'week', label: 'This week' },
            { v: 'month', label: 'This month' },
            { v: 'all', label: 'All time' },
            { v: 'custom', label: 'Custom' },
          ].map(opt => (
            <button key={opt.v} onClick={() => setPreset(opt.v)}
                    className={cx(
                      'px-2.5 py-1.5 text-[10px] uppercase tracking-widest border transition-all',
                      preset === opt.v ? 'border-[#E10600] bg-[#E10600]/15 text-white' : 'border-white/10 bg-black/30 text-white/60 hover:border-white/30'
                    )}>
              {opt.label}
            </button>
          ))}
          {preset === 'custom' && (
            <>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ colorScheme: 'dark' }}
                     className="bg-black/40 border border-white/10 focus:border-[#E10600] outline-none px-2 py-1.5 text-[11px] mono-font text-white" />
              <span className="text-white/30 text-xs">to</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ colorScheme: 'dark' }}
                     className="bg-black/40 border border-white/10 focus:border-[#E10600] outline-none px-2 py-1.5 text-[11px] mono-font text-white" />
            </>
          )}
        </div>
        {(effFrom || effTo) && (
          <div className="text-[10px] uppercase tracking-widest text-white/40 mt-3">
            Range: {effFrom || '…'} → {effTo || '…'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-white/10 border-y border-white/10 mb-6">
        <StatCard label="Revenue" value={fmtEGP(report.revenue)} accent="#FFFFFF" />
        <StatCard label="Parts cost" value={fmtEGP(report.partsCost)} accent="#FFB020" />
        <StatCard label="Parts profit" value={fmtEGP(report.partsProfit)} accent="#25D366" />
        <StatCard label="Labor revenue" value={fmtEGP(report.labor)} accent="#25D366" />
        <StatCard label="Gross profit" value={fmtEGP(report.grossProfit)} accent="#25D366" />
        <StatCard label="Expenses" value={fmtEGP(report.totalExpenses)} accent="#E10600" />
        <StatCard label="Salaries" value={fmtEGP(report.totalSalaries)} accent="#E10600" />
        <StatCard label="Net profit" value={fmtEGP(report.netProfit)} accent="#25D366" highlight />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-white/10 border-y border-white/10 mb-8">
        <StatCard label="Unpaid amount" value={fmtEGP(report.unpaid)} accent="#FFB020" />
        <StatCard label="Low stock parts" value={report.lowStockCount} accent="#E10600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-white/10 p-4">
          <h3 className="display-font text-sm uppercase mb-3">Top used parts</h3>
          {report.topParts.length === 0 ? (
            <p className="text-white/40 text-xs">No parts used in this range.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {report.topParts.map((p, i) => (
                <li key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-white/80 truncate">{p.name}</span>
                  <span className="text-[11px] text-white/50 mono-font shrink-0 ml-3">
                    {p.qty}x · {fmtEGP(p.profit)} profit
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-white/10 p-4">
          <h3 className="display-font text-sm uppercase mb-3">Most profitable bookings</h3>
          {report.topBookings.length === 0 ? (
            <p className="text-white/40 text-xs">No bookings in this range.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {report.topBookings.map(({ booking, profit, invoice }) => (
                <li key={booking.id} className="flex items-center justify-between py-2 text-sm gap-3">
                  <div className="min-w-0">
                    <div className="text-white/80 truncate">{booking.customerName || '—'}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest truncate">{booking.id} · {booking.vehicle}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[#25D366] mono-font text-xs">{fmtEGP(profit)}</div>
                    <div className="text-[10px] text-white/40 mono-font">{fmtEGP(invoice)} invoice</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

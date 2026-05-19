'use client';

import React, { useMemo } from 'react';
import { fmtEGP } from '@/lib/format';
import { bookingJobTotals } from '@/lib/usedParts';
import { isLowStock } from '@/lib/inventory';
import { StatCard, SectionHeader } from './ui';

function partsByBooking(usedParts) {
  const map = new Map();
  for (const p of usedParts) {
    const list = map.get(p.bookingId) || [];
    list.push(p);
    map.set(p.bookingId, list);
  }
  return map;
}

export default function OverviewTab({ bookings, usedParts, inventory, expenses, salaries }) {
  const data = useMemo(() => {
    const byBooking = partsByBooking(usedParts);
    let totalRevenue = 0;
    let totalPartsCost = 0;
    let totalPartsSelling = 0;
    let totalLaborRevenue = 0;
    let totalUnpaid = 0;

    const statusCount = { new: 0, in_progress: 0, waiting_parts: 0, ready: 0, delivered: 0, cancelled: 0 };

    for (const b of bookings) {
      const tot = bookingJobTotals(b, byBooking.get(b.id) || []);
      // Don't count cancelled bookings in revenue
      if (b.status !== 'cancelled') {
        totalRevenue += tot.totalInvoice;
        totalPartsCost += tot.totalPartsCost;
        totalPartsSelling += tot.totalPartsSelling;
        totalLaborRevenue += tot.laborSellingPrice;
        totalUnpaid += tot.amountRemaining;
      }
      const key = statusCount.hasOwnProperty(b.status) ? b.status : 'new';
      statusCount[key]++;
    }

    const totalPartsProfit = totalPartsSelling - totalPartsCost;
    const grossProfit = totalRevenue - totalPartsCost;
    const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalSalaries = salaries.reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const netProfit = grossProfit - totalExpenses - totalSalaries;

    const lowStockCount = inventory.filter(isLowStock).length;

    return {
      totalBookings: bookings.length,
      statusCount,
      totalRevenue,
      totalPartsCost,
      totalPartsSelling,
      totalPartsProfit,
      totalLaborRevenue,
      grossProfit,
      totalExpenses,
      totalSalaries,
      netProfit,
      totalUnpaid,
      lowStockCount,
    };
  }, [bookings, usedParts, inventory, expenses, salaries]);

  return (
    <>
      <SectionHeader eyebrow="OVERVIEW" title="Service Center Snapshot"
                     subtitle="All numbers update automatically as bookings, parts, expenses, and payments change." />

      {/* Job status row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-white/10 border-y border-white/10 mb-6">
        <StatCard label="Total bookings" value={data.totalBookings} accent="#FFFFFF" />
        <StatCard label="New" value={data.statusCount.new || 0} accent="#FFB020" />
        <StatCard label="In progress" value={data.statusCount.in_progress || 0} accent="#3B82F6" />
        <StatCard label="Waiting parts" value={data.statusCount.waiting_parts || 0} accent="#A855F7" />
        <StatCard label="Ready" value={data.statusCount.ready || 0} accent="#25D366" />
        <StatCard label="Delivered" value={data.statusCount.delivered || 0} accent="#FFFFFF" />
      </div>

      {/* Financial row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-white/10 border-y border-white/10 mb-6">
        <StatCard label="Revenue" value={fmtEGP(data.totalRevenue)} accent="#FFFFFF" />
        <StatCard label="Parts cost" value={fmtEGP(data.totalPartsCost)} accent="#FFB020" />
        <StatCard label="Parts sales" value={fmtEGP(data.totalPartsSelling)} accent="#3B82F6" />
        <StatCard label="Parts profit" value={fmtEGP(data.totalPartsProfit)} accent="#25D366" />
        <StatCard label="Labor revenue" value={fmtEGP(data.totalLaborRevenue)} accent="#25D366" />
        <StatCard label="Gross profit" value={fmtEGP(data.grossProfit)} accent="#25D366" />
        <StatCard label="Expenses" value={fmtEGP(data.totalExpenses)} accent="#E10600" />
        <StatCard label="Salaries" value={fmtEGP(data.totalSalaries)} accent="#E10600" />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border-y border-white/10 mb-2">
        <StatCard label="Net profit" value={fmtEGP(data.netProfit)} accent="#25D366" highlight
                  hint="Gross profit − expenses − salaries" />
        <StatCard label="Unpaid amount" value={fmtEGP(data.totalUnpaid)} accent="#FFB020" />
        <StatCard label="Low stock parts" value={data.lowStockCount} accent="#E10600" />
      </div>
    </>
  );
}

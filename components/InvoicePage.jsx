'use client';

import React, { useEffect, useState } from 'react';
import { supabase, supabaseConfigured, BOOKINGS_TABLE } from '@/lib/supabase';
import { fmtEGP } from '@/lib/format';
import { bookingJobTotals } from '@/lib/usedParts';
import { getInvoiceNumber } from '@/lib/invoice';
import { STATUS_LABELS, normalizeStatus } from '@/lib/bookings';

// Service center master data (single source of truth for the invoice).
const CENTER = {
  name: 'ROSSO Auto Service',
  address1: 'Industrial Area',
  address2: 'New Cairo 3, Cairo, Egypt',
  phone: '+20 110 113 9997',
  email: 'service@rosso.auto',
};

const FOOTER_NOTE =
  'Warranty terms apply on parts and workmanship as per service center policy. ' +
  'Thank you for choosing ROSSO Auto Service.';

function rowToRecord(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: normalizeStatus(row.status),
    customerName: row.customer_name || '',
    phone: row.phone || '',
    vehicle: row.vehicle || '',
    service: row.service || '',
    location: row.location || '',
    date: row.appointment_date || '',
    time: row.appointment_time || '',
    lang: row.lang || 'en',
    data: row.data || {},
    paymentStatus: row.payment_status || 'unpaid',
    paymentMethod: row.payment_method || '',
    laborSellingPrice: Number(row.labor_selling_price) || 0,
    discount: Number(row.discount) || 0,
    amountPaid: Number(row.amount_paid) || 0,
  };
}

function rowToUsedPart(row) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    inventoryPartId: row.inventory_part_id || null,
    partName: row.part_name || '',
    partCode: row.part_code || '',
    type: row.type || '',
    brand: row.brand || '',
    quantity: Number(row.quantity) || 0,
    unitCostPrice: Number(row.unit_cost_price) || 0,
    unitSellingPrice: Number(row.unit_selling_price) || 0,
    notes: row.notes || '',
  };
}

export default function InvoicePage({ bookingId }) {
  const [booking, setBooking] = useState(null);
  const [usedParts, setUsedParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [origin, setOrigin] = useState('');
  const [autoPrint, setAutoPrint] = useState(false);

  // Detect URL state on mount (?print=1 triggers print after load)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOrigin(window.location.origin);
    setAutoPrint(new URLSearchParams(window.location.search).get('print') === '1');
  }, []);

  // Fetch booking + used parts
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!supabaseConfigured) {
        setError('Supabase is not configured.');
        setLoading(false);
        return;
      }
      try {
        const [{ data: br, error: be }, { data: pr, error: pe }] = await Promise.all([
          supabase.from(BOOKINGS_TABLE).select('*').eq('id', bookingId).single(),
          supabase.from('booking_used_parts').select('*').eq('booking_id', bookingId).order('created_at', { ascending: true }),
        ]);
        if (cancelled) return;
        if (be) throw new Error(be.message || 'Booking not found.');
        setBooking(rowToRecord(br));
        if (pe) throw new Error(pe.message || 'Failed to load parts.');
        setUsedParts((pr || []).map(rowToUsedPart));
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load invoice.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [bookingId]);

  // Auto-print once data is loaded
  useEffect(() => {
    if (!autoPrint || loading || error || !booking) return;
    const t = setTimeout(() => {
      try { window.focus(); window.print(); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [autoPrint, loading, error, booking]);

  if (loading) {
    return (
      <Shell>
        <div className="loading">Loading invoice…</div>
      </Shell>
    );
  }

  if (error || !booking) {
    return (
      <Shell>
        <div className="error">
          <h1>Invoice unavailable</h1>
          <p>{error || 'Booking not found.'}</p>
          <a href="/" className="btn">Back to site</a>
        </div>
      </Shell>
    );
  }

  const d = booking.data || {};
  const invoiceNumber = getInvoiceNumber(booking);
  const totals = bookingJobTotals(booking, usedParts);
  const itemsTotal = totals.totalPartsSelling;
  const laborTotal = totals.laborSellingPrice;
  const subtotal = itemsTotal + laborTotal;
  const vehicleYear = d.year || '';
  const vehicleLabel = [vehicleYear, d.brand, d.model].filter(Boolean).join(' ').trim() || booking.vehicle || '—';
  const plate = d.plate || d.plateNumber || '';
  const vin = d.vin || '';
  const odoIn = d.odoIn || d.odo_in || '';
  const odoOut = d.odoOut || d.odo_out || '';
  const apptDate = booking.date || '';
  const apptTime = booking.time || '';
  const issuedAt = new Date(booking.createdAt || Date.now()).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
  const invoiceUrl = origin ? `${origin}/invoice/${bookingId}` : '';
  const qrSrc = invoiceUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=2&data=${encodeURIComponent(invoiceUrl)}`
    : null;

  return (
    <Shell>
      {/* Toolbar — hidden on print */}
      <div className="toolbar">
        <button onClick={() => window.print()} className="btn btn-primary">Print / Save as PDF</button>
        <a href="/dashboard" className="btn btn-ghost">Back to dashboard</a>
      </div>

      <div className="page">
        {/* Header */}
        <header className="head">
          <div className="head-left">
            <div className="center-name">{CENTER.name}</div>
            <div className="center-line">{CENTER.address1}</div>
            <div className="center-line">{CENTER.address2}</div>
            <div className="center-line">{CENTER.phone}</div>
            <div className="center-line">{CENTER.email}</div>
          </div>
          <div className="head-center">
            <div className="brand">
              <span className="logo">ROSSO</span>
              <span className="logo-reg">®</span>
            </div>
            <div className="tagline">Premium Automotive Service</div>
          </div>
          <div className="head-right">
            {qrSrc ? (
              <img src={qrSrc} alt="Scan to view online" width="110" height="110" className="qr" />
            ) : (
              <div className="qr-placeholder" />
            )}
            <div className="qr-hint">Scan to view online</div>
          </div>
        </header>

        {/* Invoice title */}
        <div className="invoice-title">
          <span>Invoice</span> <strong>{invoiceNumber}</strong>
        </div>

        {/* Bill to + Date */}
        <section className="two-col">
          <div className="bill-to">
            <h3>Bill to</h3>
            <div className="name">{booking.customerName || d.name || '—'}</div>
            {booking.phone && <div className="line">{booking.phone}</div>}
            {d.whatsapp && <div className="line">WhatsApp: {d.whatsapp}</div>}
            {d.email && <div className="line">{d.email}</div>}
          </div>
          <div className="meta">
            <div className="meta-row"><span className="k">Date issued</span><span className="v">{issuedAt}</span></div>
            <div className="meta-row"><span className="k">Booking ref</span><span className="v mono">{booking.id}</span></div>
            {apptDate && <div className="meta-row"><span className="k">Appointment</span><span className="v">{apptDate} {apptTime}</span></div>}
            {booking.location && <div className="meta-row"><span className="k">Location</span><span className="v">{booking.location}</span></div>}
            <div className="meta-row"><span className="k">Job status</span><span className="v">{STATUS_LABELS[booking.status] || booking.status}</span></div>
            <div className="meta-row"><span className="k">Payment</span><span className="v"><Badge status={booking.paymentStatus} /></span></div>
          </div>
        </section>

        {/* Vehicle */}
        <section className="vehicle">
          <h3>Vehicle</h3>
          <div className="veh-grid">
            <Cell label="Vehicle" value={vehicleLabel} />
            <Cell label="Plate" value={plate || '—'} />
            <Cell label="VIN" value={vin || '—'} mono />
            <Cell label="ODO in"  value={odoIn  ? `${odoIn} km`  : '—'} />
            <Cell label="ODO out" value={odoOut ? `${odoOut} km` : '—'} />
          </div>
        </section>

        {/* Parts */}
        <section className="items">
          <h3>Parts</h3>
          <table>
            <thead>
              <tr>
                <th className="num" style={{ width: 60 }}>Qty.</th>
                <th>Items</th>
                <th className="num" style={{ width: 110 }}>Price</th>
                <th className="num" style={{ width: 120 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {usedParts.length === 0 ? (
                <tr><td colSpan={4} className="empty">No parts on this invoice.</td></tr>
              ) : usedParts.map(p => {
                const meta = [p.type, p.brand].filter(Boolean).join(' · ');
                return (
                  <tr key={p.id}>
                    <td className="num">{p.quantity}</td>
                    <td>
                      <div className="part-name">{p.partName}</div>
                      {(p.partCode || meta) && (
                        <div className="part-meta">
                          {p.partCode && <span className="mono">{p.partCode}</span>}
                          {p.partCode && meta && <span> · </span>}
                          {meta && <span>{meta}</span>}
                        </div>
                      )}
                    </td>
                    <td className="num">{fmtEGP(p.unitSellingPrice)}</td>
                    <td className="num">{fmtEGP(p.quantity * p.unitSellingPrice)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Labor */}
        <section className="items">
          <h3>Labor</h3>
          <table>
            <thead>
              <tr>
                <th className="num" style={{ width: 60 }}>Hrs.</th>
                <th>Labor</th>
                <th className="num" style={{ width: 110 }}>Rate</th>
                <th className="num" style={{ width: 120 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {laborTotal > 0 ? (
                <tr>
                  <td className="num">—</td>
                  <td>
                    <div className="part-name">Workshop labor / service fee</div>
                    {(booking.service || d.description) && (
                      <div className="part-meta">{booking.service || d.description}</div>
                    )}
                  </td>
                  <td className="num">—</td>
                  <td className="num">{fmtEGP(laborTotal)}</td>
                </tr>
              ) : (
                <tr><td colSpan={4} className="empty">No labor charged.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Notes (customer-safe only) */}
        {d.customerNotes || booking.customerNotes ? (
          <section className="notes">
            <h3>Notes</h3>
            <p>{booking.customerNotes || d.customerNotes}</p>
          </section>
        ) : null}

        {/* Totals */}
        <section className="totals-wrap">
          <table className="totals">
            <tbody>
              <tr><td className="k">Items</td><td className="v">{fmtEGP(itemsTotal)}</td></tr>
              <tr><td className="k">Labor</td><td className="v">{fmtEGP(laborTotal)}</td></tr>
              <tr><td className="k">Subtotal</td><td className="v">{fmtEGP(subtotal)}</td></tr>
              {totals.discount > 0 && (
                <tr><td className="k">Discount</td><td className="v">− {fmtEGP(totals.discount)}</td></tr>
              )}
              <tr className="grand"><td className="k">Total</td><td className="v">{fmtEGP(totals.totalInvoice)}</td></tr>
              <tr><td className="k">Paid</td><td className="v">{fmtEGP(totals.amountPaid)}</td></tr>
              <tr className="balance"><td className="k">Balance Due</td><td className="v">{fmtEGP(totals.amountRemaining)}</td></tr>
            </tbody>
          </table>
        </section>

        {/* Signatures */}
        <section className="signatures">
          <div className="sig">
            <div className="sig-line" />
            <div className="sig-label">Technician signature</div>
          </div>
          <div className="sig">
            <div className="sig-line" />
            <div className="sig-label">Customer signature</div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>{FOOTER_NOTE}</p>
          <p className="muted">Invoice issued by {CENTER.name}. This is a computer-generated document.</p>
        </footer>
      </div>
    </Shell>
  );
}

function Cell({ label, value, mono }) {
  return (
    <div className="cell">
      <div className="cell-k">{label}</div>
      <div className={'cell-v' + (mono ? ' mono' : '')}>{value}</div>
    </div>
  );
}

function Badge({ status }) {
  const map = {
    paid: { c: '#25D366', bg: '#e8f9ee' },
    partial: { c: '#3B82F6', bg: '#e9f1ff' },
    unpaid: { c: '#C97A00', bg: '#fff3e0' },
  };
  const s = map[status] || map.unpaid;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      border: `1px solid ${s.c}`,
      color: s.c,
      background: s.bg,
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }}>
      {status}
    </span>
  );
}

function Shell({ children }) {
  return (
    <>
      <style jsx global>{`
        html, body { background: #f4f4f4; color: #111; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; }
        * { box-sizing: border-box; }
        .toolbar { max-width: 880px; margin: 18px auto 0; padding: 0 16px; display: flex; gap: 8px; justify-content: flex-end; }
        .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; font: 600 12px/1 'Helvetica Neue',Arial,sans-serif; letter-spacing: .1em; text-transform: uppercase; text-decoration: none; cursor: pointer; border: 0; }
        .btn-primary { background: #E10600; color: #fff; }
        .btn-primary:hover { background: #FF1A0F; }
        .btn-ghost   { background: #fff; color: #111; border: 1px solid #ddd; }
        .btn-ghost:hover { border-color: #111; }
        .loading, .error { max-width: 880px; margin: 60px auto; padding: 40px; background: #fff; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,.05); }
        .error h1 { font-size: 18px; color: #E10600; margin: 0 0 8px; }
        .error p { color: #555; }
        .page { max-width: 880px; margin: 16px auto 40px; background: #fff; padding: 32px clamp(18px, 4vw, 44px); box-shadow: 0 2px 24px rgba(0,0,0,.08); color: #111; }
        .page h3 { margin: 0 0 8px; font-size: 10px; letter-spacing: .25em; text-transform: uppercase; color: #888; font-weight: 700; }
        .mono { font-family: 'Courier New', monospace; font-size: 12px; }

        .head { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; align-items: start; padding-bottom: 18px; border-bottom: 2px solid #111; margin-bottom: 18px; }
        .head-left .center-name { font-weight: 800; font-size: 13px; margin-bottom: 4px; }
        .head-left .center-line { font-size: 11px; color: #444; line-height: 1.55; }
        .head-center { text-align: center; }
        .head-center .brand { display: inline-flex; align-items: baseline; }
        .head-center .logo { font-family: 'Audiowide','Helvetica Neue',Arial,sans-serif; font-size: 34px; color: #E10600; letter-spacing: -0.03em; line-height: 1; }
        .head-center .logo-reg { color: #E10600; font-size: 11px; margin-left: 2px; }
        .head-center .tagline { font-size: 10px; color: #555; letter-spacing: .25em; text-transform: uppercase; margin-top: 6px; }
        .head-right { text-align: right; }
        .head-right .qr { display: block; margin-left: auto; }
        .head-right .qr-placeholder { width: 110px; height: 110px; background: #eee; margin-left: auto; }
        .head-right .qr-hint { font-size: 10px; color: #888; letter-spacing: .15em; text-transform: uppercase; margin-top: 6px; }

        .invoice-title { text-align: center; font-size: 22px; font-weight: 600; margin: 6px 0 18px; letter-spacing: .04em; }
        .invoice-title strong { color: #E10600; font-weight: 800; }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-bottom: 18px; }
        .bill-to .name { font-weight: 700; font-size: 14px; margin-bottom: 3px; }
        .bill-to .line { font-size: 12px; color: #444; line-height: 1.6; }
        .meta { display: flex; flex-direction: column; gap: 4px; }
        .meta-row { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; padding: 2px 0; }
        .meta-row .k { color: #888; }
        .meta-row .v { color: #111; text-align: right; }

        .vehicle { margin-bottom: 18px; padding: 12px 14px; border: 1px solid #e5e5e5; background: #fafafa; }
        .veh-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
        .cell .cell-k { font-size: 10px; letter-spacing: .15em; text-transform: uppercase; color: #888; margin-bottom: 2px; }
        .cell .cell-v { font-size: 12px; color: #111; word-break: break-word; }
        .cell .cell-v.mono { font-family: 'Courier New', monospace; font-size: 11px; }
        @media (max-width: 640px) {
          .veh-grid { grid-template-columns: repeat(2, 1fr); }
          .two-col  { grid-template-columns: 1fr; }
          .head     { grid-template-columns: 1fr; text-align: left; }
          .head-center, .head-right { text-align: left; }
          .head-right .qr, .head-right .qr-placeholder { margin-left: 0; }
        }

        .items { margin-bottom: 14px; }
        .items table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .items thead th { text-align: left; font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: #888; font-weight: 700; border-bottom: 2px solid #111; padding: 8px 6px; }
        .items thead th.num { text-align: right; }
        .items tbody td { padding: 9px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
        .items tbody td.num { text-align: right; white-space: nowrap; }
        .items tbody td.empty { text-align: center; color: #aaa; font-style: italic; padding: 14px; }
        .part-name { font-weight: 600; }
        .part-meta { font-size: 11px; color: #888; margin-top: 2px; }

        .notes { margin: 14px 0; }
        .notes p { font-size: 12px; color: #444; line-height: 1.6; margin: 0; }

        .totals-wrap { display: flex; justify-content: flex-end; margin-top: 8px; }
        .totals { width: 320px; border-collapse: collapse; }
        .totals td { padding: 6px 0; font-size: 13px; }
        .totals td.k { color: #666; }
        .totals td.v { text-align: right; font-weight: 600; }
        .totals tr.grand td { border-top: 2px solid #111; padding-top: 10px; font-size: 16px; }
        .totals tr.grand td.v { color: #E10600; }
        .totals tr.balance td { font-size: 14px; }
        .totals tr.balance td.v { color: #E10600; }
        @media (max-width: 640px) { .totals { width: 100%; } }

        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 36px; }
        .sig .sig-line { border-top: 1px solid #333; height: 1px; margin-bottom: 6px; }
        .sig .sig-label { font-size: 11px; letter-spacing: .15em; text-transform: uppercase; color: #666; }

        .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #ddd; text-align: center; }
        .footer p { font-size: 11px; color: #555; line-height: 1.7; margin: 4px 0; }
        .footer .muted { color: #888; }

        @media print {
          html, body { background: #fff; }
          .toolbar { display: none !important; }
          .page { box-shadow: none; margin: 0; padding: 18mm 14mm; max-width: none; }
          @page { size: A4; margin: 0; }
          a[href]::after { content: ''; }
        }
      `}</style>
      {children}
    </>
  );
}

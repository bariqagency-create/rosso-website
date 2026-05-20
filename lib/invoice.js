// ─────────────────────────────────────────────────────────────
// Invoice builders.
// Invoice numbers and totals are DERIVED from the booking + used
// parts (never stored or hardcoded). Cost price / profit are kept
// out of every customer-facing surface.
// ─────────────────────────────────────────────────────────────
import { bookingJobTotals } from './usedParts';
import { fmtEGP } from './format';
import { STATUS_LABELS } from './bookings';

export function getInvoiceNumber(booking) {
  if (!booking?.id) return 'INV-—';
  // Bookings look like RSO-260519-XXXX → INV-260519-XXXX
  if (/^RSO-/i.test(booking.id)) return booking.id.replace(/^RSO-/i, 'INV-');
  return `INV-${booking.id}`;
}

// Structured data used by both the on-screen view and the print window.
export function buildInvoiceData(booking, usedParts) {
  const d = booking?.data || {};
  const totals = bookingJobTotals(booking, usedParts);
  return {
    invoiceNumber: getInvoiceNumber(booking),
    bookingRef:    booking?.id || '',
    issuedAt:      new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' }),
    customer: {
      name:     booking?.customerName || d.name || '',
      phone:    booking?.phone || d.phone || '',
      whatsapp: d.whatsapp || '',
      email:    d.email || '',
    },
    vehicle: {
      brand: d.brand || '',
      model: d.model || '',
      vin:   d.vin || '',
      label: [d.brand, d.model].filter(Boolean).join(' ').trim() || (booking?.vehicle || ''),
    },
    appointment: {
      date:     booking?.date || '',
      time:     booking?.time || '',
      location: booking?.location || (d.locationType === 'mobile' ? 'Mobile / Home Service' : 'Service Center Visit'),
    },
    statusLabel:        STATUS_LABELS[booking?.status] || booking?.status || '',
    paymentStatusLabel: (booking?.paymentStatus || 'unpaid'),
    paymentMethod:      booking?.paymentMethod || '',
    parts: (usedParts || []).map(p => ({
      name:         p.partName || '',
      code:         p.partCode || '',
      type:         p.type || '',
      brand:        p.brand || '',
      quantity:     Number(p.quantity) || 0,
      unitSelling:  Number(p.unitSellingPrice) || 0,
      totalSelling: (Number(p.quantity) || 0) * (Number(p.unitSellingPrice) || 0),
    })),
    labor:            totals.laborSellingPrice,
    discount:         totals.discount,
    partsSubtotal:    totals.totalPartsSelling,
    totalInvoice:     totals.totalInvoice,
    amountPaid:       totals.amountPaid,
    amountRemaining:  totals.amountRemaining,
  };
}

// Build the public-facing invoice URL (absolute when origin is available).
export function getInvoiceUrl(bookingId, opts = {}) {
  if (!bookingId) return '';
  const path = `/invoice/${encodeURIComponent(bookingId)}${opts.print ? '?print=1' : ''}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin + path;
  }
  return path;
}

// ── Customer-facing WhatsApp invoice message ─────────────────
export function formatInvoiceWhatsApp(booking, usedParts, isAr = false, invoiceUrl = '') {
  const inv = buildInvoiceData(booking, usedParts);
  const L = (en, ar) => (isAr ? ar : en);
  const lines = [];

  lines.push(`🧾 *ROSSO — ${L('Invoice', 'فاتورة')}*`);
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  if (inv.customer.name) lines.push(`${L('Customer', 'العميل')}: ${inv.customer.name}`);
  if (inv.vehicle.label) lines.push(`${L('Vehicle', 'السيارة')}: ${inv.vehicle.label}`);
  lines.push(`${L('Booking', 'الحجز')}: ${inv.bookingRef}`);
  lines.push(`${L('Invoice', 'فاتورة')}: ${inv.invoiceNumber}`);
  lines.push('');

  // Short service list — names + qty only, no prices per item
  if (inv.parts.length > 0) {
    lines.push(`*${L('Services / Parts', 'الخدمات / القطع')}*`);
    for (const p of inv.parts) {
      const qty = p.quantity > 1 ? ` x${p.quantity}` : '';
      lines.push(`• ${p.name}${qty}`);
    }
  }
  if (inv.labor > 0) lines.push(`• ${L('Labor / Service Fee', 'أجرة العمل')}`);
  if (inv.parts.length > 0 || inv.labor > 0) lines.push('');

  if (inv.discount > 0) lines.push(`${L('Discount', 'خصم')}: ${fmtEGP(inv.discount)}`);
  lines.push(`*${L('Total', 'الإجمالي')}: ${fmtEGP(inv.totalInvoice)}*`);
  lines.push(`${L('Paid', 'المدفوع')}: ${fmtEGP(inv.amountPaid)}`);
  lines.push(`${L('Remaining', 'المتبقي')}: ${fmtEGP(inv.amountRemaining)}`);

  if (invoiceUrl) {
    lines.push('');
    lines.push(`${L('View invoice', 'عرض الفاتورة')}: ${invoiceUrl}`);
  }

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push(L('Thank you for choosing ROSSO. 🏁', 'شكراً لاختياركم روسو. 🏁'));

  return lines.join('\n');
}

export function getInvoiceWhatsAppLink(booking, usedParts) {
  const d = booking?.data || {};
  const number = (d.whatsapp || booking?.phone || d.phone || '').replace(/\D/g, '');
  if (!number) return null;
  const url = getInvoiceUrl(booking?.id);
  const msg = encodeURIComponent(formatInvoiceWhatsApp(booking, usedParts, booking?.lang === 'ar', url));
  return `https://wa.me/${number}?text=${msg}`;
}

// ── Navigation helpers ───────────────────────────────────────
// Replace the unreliable about:blank popup with a real route.
export function openInvoice(bookingId, opts = {}) {
  if (typeof window === 'undefined' || !bookingId) return;
  const url = `/invoice/${encodeURIComponent(bookingId)}${opts.print ? '?print=1' : ''}`;
  // Same-tab nav avoids popup blockers and the iOS blank-window bug.
  window.open(url, '_blank', 'noopener');
}

// ── Printable invoice (popup window) ─────────────────────────
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function partsTableHtml(parts) {
  if (!parts.length) {
    return '<tr><td colspan="6" style="text-align:center;color:#888;padding:16px">No parts in this invoice.</td></tr>';
  }
  return parts.map(p => {
    const meta = [p.type, p.brand].filter(Boolean).join(' · ');
    return `
      <tr>
        <td>
          <div class="part-name">${esc(p.name)}</div>
          ${meta ? `<div class="part-meta">${esc(meta)}</div>` : ''}
        </td>
        <td class="mono">${esc(p.code || '—')}</td>
        <td class="num">${p.quantity}</td>
        <td class="num">${fmtEGP(p.unitSelling)}</td>
        <td class="num">${fmtEGP(p.totalSelling)}</td>
      </tr>
    `;
  }).join('');
}

export function buildInvoiceHtml(booking, usedParts, { autoPrint = false } = {}) {
  const inv = buildInvoiceData(booking, usedParts);
  const paymentBadge = inv.paymentStatusLabel ? `<span class="badge ${inv.paymentStatusLabel}">${inv.paymentStatusLabel}</span>` : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Invoice ${esc(inv.invoiceNumber)} — ROSSO</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *,*::before,*::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f4f4f4; color: #111; font-family: 'Helvetica Neue', Arial, sans-serif; }
  .page { max-width: 820px; margin: 24px auto; background: #fff; padding: 40px 44px; box-shadow: 0 2px 24px rgba(0,0,0,0.08); }
  .toolbar { max-width: 820px; margin: 16px auto 0; display: flex; gap: 8px; justify-content: flex-end; }
  .toolbar button { background: #E10600; color: #fff; border: 0; font: 600 12px/1 'Helvetica Neue',Arial,sans-serif; padding: 10px 16px; letter-spacing: .1em; text-transform: uppercase; cursor: pointer; }
  .toolbar button.alt { background: #111; }
  .toolbar button:hover { opacity: .9; }

  .head { display:flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 18px; margin-bottom: 22px; }
  .brand .logo { display:inline-flex; align-items: baseline; }
  .brand .logo .name { font-family: 'Audiowide', 'Helvetica Neue', Arial, sans-serif; font-size: 30px; color: #E10600; letter-spacing: -0.03em; }
  .brand .logo .reg { color: #E10600; font-size: 10px; margin-left: 2px; }
  .brand .tagline { font-size: 11px; color:#555; letter-spacing: .25em; text-transform: uppercase; margin-top: 6px; }
  .meta { text-align: right; }
  .meta .title { font-size: 11px; letter-spacing: .3em; text-transform: uppercase; color: #555; }
  .meta .num { font-size: 22px; font-weight: 800; margin-top: 4px; }
  .meta .row { font-size: 12px; color: #333; margin-top: 6px; }

  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-bottom: 24px; }
  .card { border: 1px solid #e3e3e3; padding: 14px 16px; }
  .card h3 { margin: 0 0 8px; font-size: 10px; letter-spacing: .25em; text-transform: uppercase; color: #888; font-weight: 700; }
  .card .row { display:flex; justify-content: space-between; gap: 12px; padding: 4px 0; font-size: 13px; }
  .card .row .k { color: #777; }
  .card .row .v { color: #111; text-align: right; }

  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .2em; color: #777; font-weight: 700; border-bottom: 2px solid #111; padding: 8px 6px; }
  thead th.num { text-align: right; }
  tbody td { padding: 10px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
  tbody td.num { text-align: right; white-space: nowrap; }
  .mono { font-family: 'Courier New', monospace; font-size: 12px; color: #444; }
  .part-name { font-weight: 600; }
  .part-meta { font-size: 11px; color: #888; margin-top: 2px; }

  .totals { display: flex; justify-content: flex-end; margin-top: 18px; }
  .totals table { width: 320px; }
  .totals td { padding: 6px 0; font-size: 13px; border: 0; }
  .totals td.label { color: #666; }
  .totals td.val { text-align: right; font-weight: 600; }
  .totals tr.grand td { border-top: 2px solid #111; padding-top: 12px; font-size: 16px; }
  .totals tr.grand td.val { color: #E10600; }
  .totals tr.remaining td.val { color: #E10600; }

  .pay { margin-top: 18px; padding: 14px 16px; background: #f9f9f9; border-left: 4px solid #E10600; font-size: 12px; color: #444; display: flex; gap: 18px; flex-wrap: wrap; }
  .pay .badge { display:inline-block; padding: 2px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .1em; border: 1px solid #ccc; }
  .pay .badge.paid    { background: #25D366; color: #fff; border-color: #25D366; }
  .pay .badge.partial { background: #3B82F6; color: #fff; border-color: #3B82F6; }
  .pay .badge.unpaid  { background: #FFB020; color: #111; border-color: #FFB020; }

  .footer { margin-top: 28px; padding-top: 18px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #666; line-height: 1.7; }
  .footer .thanks { font-weight: 700; color: #111; }

  @media print {
    html, body { background: #fff; }
    .toolbar { display: none !important; }
    .page { box-shadow: none; margin: 0; padding: 24mm 18mm; max-width: none; }
    @page { size: A4; margin: 0; }
  }
</style>
</head>
<body>

<div class="toolbar">
  <button onclick="window.print()">Print / Save as PDF</button>
  <button class="alt" onclick="window.close()">Close</button>
</div>

<div class="page">

  <div class="head">
    <div class="brand">
      <div class="logo"><span class="name">ROSSO</span><span class="reg">®</span></div>
      <div class="tagline">Premium Automotive Service</div>
    </div>
    <div class="meta">
      <div class="title">Invoice</div>
      <div class="num">${esc(inv.invoiceNumber)}</div>
      <div class="row">Date issued: ${esc(inv.issuedAt)}</div>
      <div class="row">Booking ref: ${esc(inv.bookingRef)}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Bill to</h3>
      <div class="row"><span class="k">Name</span><span class="v">${esc(inv.customer.name) || '—'}</span></div>
      <div class="row"><span class="k">Phone</span><span class="v">${esc(inv.customer.phone) || '—'}</span></div>
      ${inv.customer.whatsapp ? `<div class="row"><span class="k">WhatsApp</span><span class="v">${esc(inv.customer.whatsapp)}</span></div>` : ''}
      ${inv.customer.email ? `<div class="row"><span class="k">Email</span><span class="v">${esc(inv.customer.email)}</span></div>` : ''}
    </div>
    <div class="card">
      <h3>Vehicle &amp; Service</h3>
      <div class="row"><span class="k">Vehicle</span><span class="v">${esc(inv.vehicle.label) || '—'}</span></div>
      ${inv.vehicle.vin ? `<div class="row"><span class="k">VIN</span><span class="v mono">${esc(inv.vehicle.vin)}</span></div>` : ''}
      <div class="row"><span class="k">Appointment</span><span class="v">${esc(inv.appointment.date) || '—'} ${esc(inv.appointment.time) || ''}</span></div>
      <div class="row"><span class="k">Location</span><span class="v">${esc(inv.appointment.location) || '—'}</span></div>
      <div class="row"><span class="k">Job status</span><span class="v">${esc(inv.statusLabel) || '—'}</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Code</th>
        <th class="num">Qty</th>
        <th class="num">Unit price</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${partsTableHtml(inv.parts)}
      ${inv.labor > 0 ? `
        <tr>
          <td><div class="part-name">Labor / Service Fee</div><div class="part-meta">Workmanship</div></td>
          <td class="mono">—</td>
          <td class="num">1</td>
          <td class="num">${fmtEGP(inv.labor)}</td>
          <td class="num">${fmtEGP(inv.labor)}</td>
        </tr>` : ''}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td class="label">Parts subtotal</td>
        <td class="val">${fmtEGP(inv.partsSubtotal)}</td>
      </tr>
      <tr>
        <td class="label">Labor</td>
        <td class="val">${fmtEGP(inv.labor)}</td>
      </tr>
      ${inv.discount > 0 ? `
      <tr>
        <td class="label">Discount</td>
        <td class="val">− ${fmtEGP(inv.discount)}</td>
      </tr>` : ''}
      <tr class="grand">
        <td class="label">Invoice total</td>
        <td class="val">${fmtEGP(inv.totalInvoice)}</td>
      </tr>
      <tr>
        <td class="label">Amount paid</td>
        <td class="val">${fmtEGP(inv.amountPaid)}</td>
      </tr>
      <tr class="remaining">
        <td class="label">Remaining</td>
        <td class="val">${fmtEGP(inv.amountRemaining)}</td>
      </tr>
    </table>
  </div>

  <div class="pay">
    <div><strong>Payment status:</strong> ${paymentBadge}</div>
    ${inv.paymentMethod ? `<div><strong>Method:</strong> ${esc(inv.paymentMethod)}</div>` : ''}
  </div>

  <div class="footer">
    <div class="thanks">Thank you for choosing ROSSO.</div>
    <div>This invoice is computer-generated from the service record.</div>
  </div>

</div>

${autoPrint ? `<script>window.addEventListener('load', function(){ setTimeout(function(){ try { window.focus(); window.print(); } catch(e){} }, 300); });</script>` : ''}

</body>
</html>`;
}

export function openInvoiceWindow(booking, usedParts, { autoPrint = false } = {}) {
  if (typeof window === 'undefined') return;
  const html = buildInvoiceHtml(booking, usedParts, { autoPrint });
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) {
    alert('Pop-up was blocked. Please allow pop-ups to view/print invoices.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Edit2, Package, AlertTriangle, FileText, MessageCircle, Printer } from 'lucide-react';
import { fmtEGP } from '@/lib/format';
import {
  PAYMENT_STATUSES, PAYMENT_METHODS, ALL_STATUSES, updateBooking,
} from '@/lib/bookings';
import { PART_TYPES } from '@/lib/inventory';
import {
  addUsedPart, updateUsedPart, deleteUsedPart, bookingJobTotals, partTotals,
} from '@/lib/usedParts';
import {
  getInvoiceNumber, openInvoice, getInvoiceWhatsAppLink,
} from '@/lib/invoice';
import {
  Field, Input, Select, TextArea, PrimaryButton, GhostButton, ErrorBanner,
  Modal, ConfirmModal, cx,
} from './ui';

const PAYMENT_BADGE = {
  unpaid:  { color: '#FFB020' },
  partial: { color: '#3B82F6' },
  paid:    { color: '#25D366' },
};

// Sync booking payment_status from amountPaid/totalInvoice
function derivePaymentStatus(amountPaid, total) {
  if (amountPaid <= 0) return 'unpaid';
  if (amountPaid >= total) return 'paid';
  return 'partial';
}

export default function JobCostPanel({ booking, usedParts, inventory, refresh }) {
  const [partModal, setPartModal] = useState(null); // null | { mode: 'new' | 'edit', data, id? }
  const [confirmDeletePart, setConfirmDeletePart] = useState(null);
  const [error, setError] = useState('');
  const [savingPart, setSavingPart] = useState(false);

  // Local field state (booking patch) — committed on blur or "Save"
  const [labor, setLabor] = useState(booking.laborSellingPrice || 0);
  const [discount, setDiscount] = useState(booking.discount || 0);
  const [amountPaid, setAmountPaid] = useState(booking.amountPaid || 0);
  const [paymentMethod, setPaymentMethod] = useState(booking.paymentMethod || 'cash');
  const [internalNotes, setInternalNotes] = useState(booking.internalNotes || '');
  const [customerNotes, setCustomerNotes] = useState(booking.customerNotes || '');
  const [savingBooking, setSavingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [savedAt, setSavedAt] = useState(0);

  const myParts = useMemo(
    () => usedParts.filter(p => p.bookingId === booking.id),
    [usedParts, booking.id]
  );

  const totals = useMemo(() => bookingJobTotals(
    { laborSellingPrice: Number(labor) || 0, discount: Number(discount) || 0, amountPaid: Number(amountPaid) || 0 },
    myParts
  ), [labor, discount, amountPaid, myParts]);

  // ── Save booking financials ─────────────────────────────────
  const saveBookingFields = async () => {
    setBookingError('');
    setSavingBooking(true);
    try {
      const paymentStatus = derivePaymentStatus(Number(amountPaid) || 0, totals.totalInvoice);
      await updateBooking(booking.id, {
        laborSellingPrice: Number(labor) || 0,
        discount: Number(discount) || 0,
        amountPaid: Number(amountPaid) || 0,
        paymentMethod,
        paymentStatus,
        internalNotes,
        customerNotes,
      });
      await refresh();
      setSavedAt(Date.now());
    } catch (e) {
      setBookingError(e?.message || 'Failed to save.');
    } finally {
      setSavingBooking(false);
    }
  };

  // ── Used part add/edit ──────────────────────────────────────
  const openAddPart = () => {
    setError('');
    setPartModal({
      mode: 'new',
      data: {
        bookingId: booking.id, inventoryPartId: '',
        partName: '', partCode: '', type: 'aftermarket', brand: '',
        quantity: 1, unitCostPrice: 0, unitSellingPrice: 0, notes: '',
      },
    });
  };

  const openEditPart = (p) => {
    setError('');
    setPartModal({ mode: 'edit', id: p.id, data: { ...p } });
  };

  const closePartModal = () => setPartModal(null);

  const onInventoryPick = (partId) => {
    const inv = inventory.find(x => x.id === partId);
    if (!inv) {
      setPartModal(m => ({ ...m, data: { ...m.data, inventoryPartId: '' } }));
      return;
    }
    setPartModal(m => ({
      ...m,
      data: {
        ...m.data,
        inventoryPartId: inv.id,
        partName: inv.name,
        partCode: inv.partCode || '',
        type: inv.type,
        brand: inv.brand || '',
        unitCostPrice: inv.costPrice,
        unitSellingPrice: inv.sellingPrice,
      },
    }));
  };

  const handleSavePart = async () => {
    if (!partModal) return;
    setError('');
    setSavingPart(true);
    try {
      const d = partModal.data;
      if (!d.partName?.trim()) throw new Error('Part name is required.');
      if (Number(d.quantity) <= 0) throw new Error('Quantity must be greater than zero.');
      if (partModal.mode === 'new') {
        await addUsedPart(d);
      } else {
        await updateUsedPart(partModal.id, d);
      }
      await refresh();
      setPartModal(null);
    } catch (e) {
      setError(e?.message || 'Failed to save part.');
    } finally {
      setSavingPart(false);
    }
  };

  const handleDeletePart = async (id) => {
    try {
      await deleteUsedPart(id);
      await refresh();
      setConfirmDeletePart(null);
    } catch (e) {
      setError(e?.message || 'Failed to delete part.');
    }
  };

  const currentPart = partModal?.data;
  const linkedInv = currentPart?.inventoryPartId
    ? inventory.find(x => x.id === currentPart.inventoryPartId)
    : null;
  const previousQty = partModal?.mode === 'edit'
    ? (myParts.find(p => p.id === partModal.id)?.quantity || 0)
    : 0;
  const stockHint = linkedInv
    ? `Available in stock: ${linkedInv.quantityAvailable}${partModal?.mode === 'edit' ? ` (this line currently holds ${previousQty})` : ''}`
    : null;

  return (
    <div className="space-y-6">
      {/* Used parts list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="display-font text-sm uppercase tracking-wider">Used parts</h4>
          <PrimaryButton onClick={openAddPart} className="!py-1.5 !px-3"><Plus size={11} /> Add part</PrimaryButton>
        </div>

        {error && <div className="mb-3"><ErrorBanner>{error}</ErrorBanner></div>}

        {myParts.length === 0 ? (
          <div className="bg-black/30 border border-white/10 px-4 py-6 text-center text-white/40 text-xs">
            No parts added yet.
          </div>
        ) : (
          <div className="border border-white/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-white/40">
                <tr>
                  <th className="text-left px-3 py-2 font-normal">Part</th>
                  <th className="text-left px-3 py-2 font-normal">Type</th>
                  <th className="text-right px-3 py-2 font-normal">Qty</th>
                  <th className="text-right px-3 py-2 font-normal">Cost</th>
                  <th className="text-right px-3 py-2 font-normal">Sell</th>
                  <th className="text-right px-3 py-2 font-normal">Profit</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {myParts.map(p => {
                  const t = partTotals(p);
                  return (
                    <tr key={p.id} className="border-t border-white/5">
                      <td className="px-3 py-2 text-white">
                        <div className="flex items-center gap-2">
                          {p.inventoryPartId && <Package size={11} className="text-[#3B82F6] shrink-0" title="From inventory" />}
                          <span className="truncate">{p.partName}</span>
                        </div>
                        {(p.partCode || p.brand) && (
                          <div className="text-[10px] text-white/40 mono-font">{[p.partCode, p.brand].filter(Boolean).join(' · ')}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/60">{p.type || '—'}</td>
                      <td className="px-3 py-2 text-right mono-font text-xs">{p.quantity}</td>
                      <td className="px-3 py-2 text-right mono-font text-xs text-white/70">{fmtEGP(t.totalCost)}</td>
                      <td className="px-3 py-2 text-right mono-font text-xs text-white/90">{fmtEGP(t.totalSelling)}</td>
                      <td className="px-3 py-2 text-right mono-font text-xs text-[#25D366]">{fmtEGP(t.profit)}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <button onClick={() => openEditPart(p)} className="text-white/50 hover:text-white px-1.5 py-1"><Edit2 size={11} /></button>
                        <button onClick={() => setConfirmDeletePart(p.id)} className="text-white/50 hover:text-[#E10600] px-1.5 py-1"><Trash2 size={11} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Labor + discount + payment */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-3">
          <h4 className="display-font text-sm uppercase tracking-wider">Job financials</h4>
          <div className="flex items-center gap-2">
            {savedAt > 0 && (Date.now() - savedAt < 4000) && <span className="text-[10px] text-[#25D366] uppercase tracking-widest">Saved</span>}
            <PrimaryButton onClick={saveBookingFields} disabled={savingBooking} className="!py-1.5 !px-3">
              {savingBooking ? 'Saving…' : 'Save'}
            </PrimaryButton>
          </div>
        </div>

        {bookingError && <div className="mb-3"><ErrorBanner>{bookingError}</ErrorBanner></div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Labor / service fee (EGP)" hint="Counted as revenue/profit (technicians are salaried)">
            <Input type="number" min="0" step="any" value={labor} onChange={(e) => setLabor(e.target.value)} />
          </Field>
          <Field label="Discount (EGP)">
            <Input type="number" min="0" step="any" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </Field>
          <Field label="Payment method">
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>
          <Field label="Amount paid (EGP)" hint="Payment status auto-derives from paid vs invoice">
            <Input type="number" min="0" step="any" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
          </Field>
          <Field label="Internal notes" className="md:col-span-2">
            <TextArea rows={2} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
          </Field>
          <Field label="Customer notes" className="md:col-span-3">
            <TextArea rows={2} value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Internal financials (admin only — cost/profit) */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
          <span>Internal financials (admin only)</span>
          <span className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10">
          <Cell label="Parts cost"   value={fmtEGP(totals.totalPartsCost)}    accent="#FFB020" />
          <Cell label="Parts sales"  value={fmtEGP(totals.totalPartsSelling)} accent="#3B82F6" />
          <Cell label="Parts profit" value={fmtEGP(totals.totalPartsProfit)}  accent="#25D366" />
          <Cell label="Labor profit" value={fmtEGP(totals.laborProfit)}       accent="#25D366" />
          <Cell label="Job cost"     value={fmtEGP(totals.totalJobCost)}      accent="#FFB020" />
          <Cell label="Discount"     value={fmtEGP(totals.discount)}          accent="#FFFFFF" />
          <Cell label="Gross profit" value={fmtEGP(totals.grossProfit)}       accent="#25D366" highlight />
          <Cell label="Remaining"    value={fmtEGP(totals.amountRemaining)}   accent="#FFB020" />
        </div>
      </div>

      {/* Invoice section (customer-facing) */}
      <InvoiceSection booking={booking}
                      usedParts={myParts}
                      totals={totals}
                      paymentStatusOverride={derivePaymentStatus(Number(amountPaid) || 0, totals.totalInvoice)} />

      {/* Part modal */}
      <Modal open={!!partModal} onClose={closePartModal} wide
             title={partModal?.mode === 'new' ? 'Add used part' : 'Edit used part'}
             footer={
               <>
                 <GhostButton onClick={closePartModal} disabled={savingPart}>Cancel</GhostButton>
                 <PrimaryButton onClick={handleSavePart} disabled={savingPart}>{savingPart ? 'Saving…' : 'Save'}</PrimaryButton>
               </>
             }>
        {partModal && (
          <div className="space-y-3">
            {error && <ErrorBanner>{error}</ErrorBanner>}

            <Field label="Pick from inventory (optional)" hint={stockHint}>
              <Select value={currentPart.inventoryPartId || ''} onChange={(e) => onInventoryPick(e.target.value)}>
                <option value="">— Manual entry (not in inventory) —</option>
                {inventory.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.partCode ? `(${p.partCode})` : ''} · stock {p.quantityAvailable}
                  </option>
                ))}
              </Select>
            </Field>

            {linkedInv && Number(currentPart.quantity) > linkedInv.quantityAvailable + previousQty && (
              <div className="flex items-center gap-2 text-xs text-[#E10600]">
                <AlertTriangle size={12} /> Quantity exceeds available stock.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Part name *">
                <Input value={currentPart.partName} onChange={(e) => setPartModal(m => ({ ...m, data: { ...m.data, partName: e.target.value } }))} />
              </Field>
              <Field label="Part code">
                <Input value={currentPart.partCode} onChange={(e) => setPartModal(m => ({ ...m, data: { ...m.data, partCode: e.target.value } }))} />
              </Field>
              <Field label="Type">
                <Select value={currentPart.type} onChange={(e) => setPartModal(m => ({ ...m, data: { ...m.data, type: e.target.value } }))}>
                  <option value="">—</option>
                  {PART_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Brand">
                <Input value={currentPart.brand} onChange={(e) => setPartModal(m => ({ ...m, data: { ...m.data, brand: e.target.value } }))} />
              </Field>
              <Field label="Quantity *">
                <Input type="number" min="0" step="any" value={currentPart.quantity} onChange={(e) => setPartModal(m => ({ ...m, data: { ...m.data, quantity: e.target.value } }))} />
              </Field>
              <Field label="Unit cost (EGP)">
                <Input type="number" min="0" step="any" value={currentPart.unitCostPrice} onChange={(e) => setPartModal(m => ({ ...m, data: { ...m.data, unitCostPrice: e.target.value } }))} />
              </Field>
              <Field label="Unit selling (EGP)">
                <Input type="number" min="0" step="any" value={currentPart.unitSellingPrice} onChange={(e) => setPartModal(m => ({ ...m, data: { ...m.data, unitSellingPrice: e.target.value } }))} />
              </Field>
            </div>
            <Field label="Notes">
              <TextArea rows={2} value={currentPart.notes} onChange={(e) => setPartModal(m => ({ ...m, data: { ...m.data, notes: e.target.value } }))} />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!confirmDeletePart}
        onClose={() => setConfirmDeletePart(null)}
        onConfirm={() => handleDeletePart(confirmDeletePart)}
        title="Remove part?"
        message="The part will be removed from this job and quantity will be returned to inventory if it was linked."
      />
    </div>
  );
}

function Cell({ label, value, accent = '#FFFFFF', highlight }) {
  return (
    <div className={cx('bg-[#0A0A0A] px-3 py-3 flex flex-col gap-1', highlight && 'bg-[#E10600]/5')}>
      <span className="mono-font text-base leading-none" style={{ color: accent }}>{value}</span>
      <span className="text-[9px] uppercase tracking-widest text-white/40">{label}</span>
    </div>
  );
}

// ── Invoice section ───────────────────────────────────────────
function InvoiceSection({ booking, usedParts, totals, paymentStatusOverride }) {
  const invoiceNumber = getInvoiceNumber(booking);
  const paymentStatus = paymentStatusOverride || booking.paymentStatus || 'unpaid';
  const badge = PAYMENT_BADGE[paymentStatus] || PAYMENT_BADGE.unpaid;
  // Snapshot booking with the latest in-progress financial state so the
  // invoice always reflects what the admin sees — no need to wait for a
  // re-fetch after Save.
  const bookingForInvoice = {
    ...booking,
    paymentStatus,
    laborSellingPrice: totals.laborSellingPrice,
    discount: totals.discount,
    amountPaid: totals.amountPaid,
  };
  const waLink = getInvoiceWhatsAppLink(bookingForInvoice, usedParts);

  const handleView  = () => openInvoice(booking.id, { print: false });
  const handlePrint = () => openInvoice(booking.id, { print: true });

  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
        <span>Invoice (customer-facing)</span>
        <span className="h-px flex-1 bg-white/5" />
      </div>
      <div className="bg-black/40 border border-white/10 p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Invoice number</div>
            <div className="mono-font text-base md:text-lg text-white mt-1">{invoiceNumber}</div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-widest border self-start md:self-auto"
                style={{ borderColor: `${badge.color}55`, color: badge.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.color }} />
            {paymentStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <InvCell label="Invoice total" value={fmtEGP(totals.totalInvoice)} />
          <InvCell label="Amount paid"   value={fmtEGP(totals.amountPaid)}   color="#25D366" />
          <InvCell label="Remaining"     value={fmtEGP(totals.amountRemaining)} color="#FFB020" />
          <InvCell label="Items" value={`${usedParts.length} part${usedParts.length === 1 ? '' : 's'}${totals.laborSellingPrice > 0 ? ' + labor' : ''}`} />
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleView}
                  className="inline-flex items-center justify-center gap-2 h-9 px-3 border border-white/15 text-white/80 hover:border-[#E10600] hover:bg-[#E10600]/10 hover:text-white text-[11px] uppercase tracking-widest font-medium transition-all">
            <FileText size={12} /> View invoice
          </button>
          {waLink ? (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center justify-center gap-2 h-9 px-3 bg-[#25D366] hover:bg-[#1ebd57] text-white text-[11px] uppercase tracking-widest font-bold transition-all">
              <MessageCircle size={12} /> Send invoice via WhatsApp
            </a>
          ) : (
            <button disabled title="No WhatsApp / phone number on file"
                    className="inline-flex items-center justify-center gap-2 h-9 px-3 bg-white/5 text-white/30 text-[11px] uppercase tracking-widest font-bold cursor-not-allowed">
              <MessageCircle size={12} /> Send invoice via WhatsApp
            </button>
          )}
          <button onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-2 h-9 px-3 border border-white/15 text-white/80 hover:border-[#E10600] hover:bg-[#E10600]/10 hover:text-white text-[11px] uppercase tracking-widest font-medium transition-all">
            <Printer size={12} /> Print invoice
          </button>
        </div>
      </div>
    </div>
  );
}

function InvCell({ label, value, color }) {
  return (
    <div className="bg-black/30 border border-white/5 px-3 py-2.5">
      <div className="text-[9px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="mono-font text-sm mt-1 truncate" style={{ color: color || '#FFFFFF' }}>{value}</div>
    </div>
  );
}

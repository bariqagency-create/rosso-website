'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, X } from 'lucide-react';
import { fmtEGP } from '@/lib/format';
import {
  createInventoryPart, updateInventoryPart, deleteInventoryPart,
  PART_TYPES, isLowStock, stockValue, expectedSalesValue,
} from '@/lib/inventory';
import {
  StatCard, SectionHeader, Modal, Field, Input, Select, TextArea,
  PrimaryButton, GhostButton, ErrorBanner, ConfirmModal, Empty, cx,
} from './ui';

const empty = {
  name: '', partCode: '', type: 'aftermarket', brand: '',
  quantityAvailable: 0, costPrice: 0, sellingPrice: 0,
  minimumStock: 0, supplier: '', shelfLocation: '', notes: '',
};

export default function InventoryTab({ inventory, refresh }) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [onlyLow, setOnlyLow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inventory.filter(p => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (onlyLow && !isLowStock(p)) return false;
      if (!q) return true;
      return [p.name, p.partCode, p.brand, p.supplier, p.shelfLocation].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [inventory, query, typeFilter, onlyLow]);

  const totals = useMemo(() => {
    let stock = 0, sales = 0;
    let low = 0;
    for (const p of inventory) {
      stock += stockValue(p);
      sales += expectedSalesValue(p);
      if (isLowStock(p)) low++;
    }
    return { stock, sales, profit: sales - stock, low };
  }, [inventory]);

  const openCreate = () => { setEditing('new'); setForm(empty); setError(''); };
  const openEdit = (p) => { setEditing(p.id); setForm({ ...p }); setError(''); };
  const close = () => { setEditing(null); setError(''); };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      if (!form.name?.trim()) throw new Error('Part name is required.');
      if (editing === 'new') {
        await createInventoryPart(form);
      } else {
        await updateInventoryPart(editing, form);
      }
      await refresh();
      close();
    } catch (e) {
      setError(e?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInventoryPart(id);
      await refresh();
      setConfirmDelete(null);
    } catch (e) {
      setError(e?.message || 'Failed to delete.');
    }
  };

  return (
    <>
      <SectionHeader
        eyebrow="INVENTORY"
        title="Spare Parts"
        subtitle="Stock counts, cost and selling prices. Used parts inside a job auto-deduct from here."
        right={<PrimaryButton onClick={openCreate}><Plus size={12} /> Add part</PrimaryButton>}
      />

      {/* Inventory totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border-y border-white/10 mb-6">
        <StatCard label="Total parts" value={inventory.length} accent="#FFFFFF" />
        <StatCard label="Stock value" value={fmtEGP(totals.stock)} accent="#FFB020" />
        <StatCard label="Expected sales" value={fmtEGP(totals.sales)} accent="#3B82F6" />
        <StatCard label="Expected profit" value={fmtEGP(totals.profit)} accent="#25D366" />
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-[#0F0F0F] to-[#0A0A0A] border border-white/10 p-4 mb-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, code, brand, supplier..."
            className="w-full bg-black/40 border border-white/10 focus:border-[#E10600] outline-none py-2.5 pl-9 pr-10 text-sm placeholder-white/30 transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['all', ...PART_TYPES].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
                    className={cx(
                      'px-2.5 py-1.5 text-[10px] uppercase tracking-widest border transition-all',
                      typeFilter === t
                        ? 'border-[#E10600] bg-[#E10600]/15 text-white'
                        : 'border-white/10 bg-black/30 text-white/60 hover:border-white/30'
                    )}>
              {t === 'all' ? 'All types' : t}
            </button>
          ))}
          <button onClick={() => setOnlyLow(v => !v)}
                  className={cx(
                    'px-2.5 py-1.5 text-[10px] uppercase tracking-widest border transition-all inline-flex items-center gap-1.5',
                    onlyLow ? 'border-[#E10600] bg-[#E10600]/15 text-white' : 'border-white/10 bg-black/30 text-white/60 hover:border-white/30'
                  )}>
            <AlertTriangle size={11} />
            Low stock only ({totals.low})
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Empty
          icon={<Package size={20} className="text-[#E10600]" />}
          title={inventory.length === 0 ? 'No parts yet' : 'No parts match your filters'}
          hint={inventory.length === 0 ? 'Add your first spare part to start tracking stock.' : null}
          action={inventory.length === 0 ? <PrimaryButton onClick={openCreate}><Plus size={12} /> Add part</PrimaryButton> : null}
        />
      ) : (
        <div className="border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="text-left px-4 py-3 font-normal">Part</th>
                <th className="text-left px-4 py-3 font-normal">Code</th>
                <th className="text-left px-4 py-3 font-normal">Type</th>
                <th className="text-right px-4 py-3 font-normal">Qty</th>
                <th className="text-right px-4 py-3 font-normal">Cost</th>
                <th className="text-right px-4 py-3 font-normal">Sell</th>
                <th className="text-right px-4 py-3 font-normal">Stock value</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const low = isLowStock(p);
                return (
                  <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="text-white">{p.name}</div>
                      {(p.brand || p.shelfLocation) && (
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                          {[p.brand, p.shelfLocation].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 mono-font text-xs text-white/70">{p.partCode || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 border border-white/10">
                        {p.type}
                      </span>
                    </td>
                    <td className={cx('px-4 py-3 text-right mono-font', low && 'text-[#E10600]')}>
                      {p.quantityAvailable}
                      {low && <div className="text-[10px] text-[#E10600] uppercase tracking-widest mt-0.5">Low</div>}
                    </td>
                    <td className="px-4 py-3 text-right text-white/80 mono-font text-xs">{fmtEGP(p.costPrice)}</td>
                    <td className="px-4 py-3 text-right text-white/80 mono-font text-xs">{fmtEGP(p.sellingPrice)}</td>
                    <td className="px-4 py-3 text-right text-white/80 mono-font text-xs">{fmtEGP(stockValue(p))}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(p)}
                              className="inline-flex items-center gap-1 text-white/50 hover:text-white px-2 py-1 transition-colors">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => setConfirmDelete(p.id)}
                              className="inline-flex items-center gap-1 text-white/50 hover:text-[#E10600] px-2 py-1 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={close} wide
             title={editing === 'new' ? 'Add part' : 'Edit part'}
             footer={
               <>
                 <GhostButton onClick={close} disabled={saving}>Cancel</GhostButton>
                 <PrimaryButton onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</PrimaryButton>
               </>
             }>
        <div className="space-y-3">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Name *">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </Field>
            <Field label="Part code">
              <Input value={form.partCode} onChange={(e) => setForm({ ...form, partCode: e.target.value })} />
            </Field>
            <Field label="Type *">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {PART_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Brand" hint="Only relevant for aftermarket">
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} disabled={form.type !== 'aftermarket'} />
            </Field>
            <Field label="Quantity available">
              <Input type="number" min="0" step="any" value={form.quantityAvailable} onChange={(e) => setForm({ ...form, quantityAvailable: e.target.value })} />
            </Field>
            <Field label="Minimum stock">
              <Input type="number" min="0" step="any" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} />
            </Field>
            <Field label="Cost price (EGP)">
              <Input type="number" min="0" step="any" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
            </Field>
            <Field label="Selling price (EGP)">
              <Input type="number" min="0" step="any" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
            </Field>
            <Field label="Supplier">
              <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </Field>
            <Field label="Shelf location">
              <Input value={form.shelfLocation} onChange={(e) => setForm({ ...form, shelfLocation: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <TextArea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Delete part?"
        message="This will permanently remove the part from inventory. Used-part records in past jobs are kept untouched."
      />
    </>
  );
}

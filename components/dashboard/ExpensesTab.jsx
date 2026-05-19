'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Receipt, X } from 'lucide-react';
import { fmtEGP, isoToday } from '@/lib/format';
import {
  createExpense, updateExpense, deleteExpense, EXPENSE_CATEGORIES,
} from '@/lib/expenses';
import { PAYMENT_METHODS } from '@/lib/bookings';
import {
  StatCard, SectionHeader, Modal, Field, Input, Select, TextArea,
  PrimaryButton, GhostButton, ErrorBanner, ConfirmModal, Empty, cx,
} from './ui';

const empty = {
  expenseDate: isoToday(),
  category: 'other',
  title: '',
  amount: 0,
  paymentMethod: 'cash',
  notes: '',
};

export default function ExpensesTab({ expenses, refresh }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [cat, setCat] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (cat !== 'all' && e.category !== cat) return false;
      if (from && e.expenseDate < from) return false;
      if (to && e.expenseDate > to) return false;
      return true;
    });
  }, [expenses, from, to, cat]);

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);

  const openCreate = () => { setEditing('new'); setForm(empty); setError(''); };
  const openEdit = (e) => { setEditing(e.id); setForm({ ...e }); setError(''); };
  const close = () => { setEditing(null); setError(''); };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      if (!form.title?.trim()) throw new Error('Title is required.');
      if (editing === 'new') {
        await createExpense(form);
      } else {
        await updateExpense(editing, form);
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
      await deleteExpense(id);
      await refresh();
      setConfirmDelete(null);
    } catch (e) {
      setError(e?.message || 'Failed to delete.');
    }
  };

  return (
    <>
      <SectionHeader
        eyebrow="EXPENSES"
        title="Service Center Expenses"
        subtitle="General running costs. Deducted from net profit in Overview & Reports."
        right={<PrimaryButton onClick={openCreate}><Plus size={12} /> Add expense</PrimaryButton>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border-y border-white/10 mb-6">
        <StatCard label="Total expenses" value={fmtEGP(totalAll)} accent="#E10600" />
        <StatCard label="Filtered total" value={fmtEGP(totalFiltered)} accent="#FFB020" />
        <StatCard label="Records" value={expenses.length} accent="#FFFFFF" />
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-[#0F0F0F] to-[#0A0A0A] border border-white/10 p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="From">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ colorScheme: 'dark' }} />
        </Field>
        <Field label="To">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ colorScheme: 'dark' }} />
        </Field>
        <Field label="Category">
          <Select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">All categories</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        {(from || to || cat !== 'all') && (
          <div className="md:col-span-3">
            <button onClick={() => { setFrom(''); setTo(''); setCat('all'); }}
                    className="text-[10px] uppercase tracking-widest text-white/60 hover:text-[#E10600] flex items-center gap-1">
              <X size={11} /> Clear filters
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <Empty icon={<Receipt size={20} className="text-[#E10600]" />}
               title={expenses.length === 0 ? 'No expenses yet' : 'No matches'}
               hint={expenses.length === 0 ? 'Track rent, utilities, supplies and other running costs.' : null}
               action={expenses.length === 0 ? <PrimaryButton onClick={openCreate}><Plus size={12} /> Add expense</PrimaryButton> : null} />
      ) : (
        <div className="border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="text-left px-4 py-3 font-normal">Date</th>
                <th className="text-left px-4 py-3 font-normal">Title</th>
                <th className="text-left px-4 py-3 font-normal">Category</th>
                <th className="text-left px-4 py-3 font-normal">Method</th>
                <th className="text-right px-4 py-3 font-normal">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 mono-font text-xs">{e.expenseDate}</td>
                  <td className="px-4 py-3 text-white">{e.title}{e.notes && <div className="text-[11px] text-white/40">{e.notes}</div>}</td>
                  <td className="px-4 py-3"><span className="inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 border border-white/10">{e.category}</span></td>
                  <td className="px-4 py-3 text-xs text-white/70">{e.paymentMethod || '—'}</td>
                  <td className="px-4 py-3 text-right text-white/90 mono-font text-xs">{fmtEGP(e.amount)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(e)} className="text-white/50 hover:text-white px-2 py-1"><Edit2 size={12} /></button>
                    <button onClick={() => setConfirmDelete(e.id)} className="text-white/50 hover:text-[#E10600] px-2 py-1"><Trash2 size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={close}
             title={editing === 'new' ? 'Add expense' : 'Edit expense'}
             footer={<>
               <GhostButton onClick={close} disabled={saving}>Cancel</GhostButton>
               <PrimaryButton onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</PrimaryButton>
             </>}>
        <div className="space-y-3">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Date *">
              <Input type="date" value={form.expenseDate} onChange={(ev) => setForm({ ...form, expenseDate: ev.target.value })} style={{ colorScheme: 'dark' }} />
            </Field>
            <Field label="Category *">
              <Select value={form.category} onChange={(ev) => setForm({ ...form, category: ev.target.value })}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Title *" className="md:col-span-2">
              <Input value={form.title} onChange={(ev) => setForm({ ...form, title: ev.target.value })} autoFocus />
            </Field>
            <Field label="Amount (EGP)">
              <Input type="number" min="0" step="any" value={form.amount} onChange={(ev) => setForm({ ...form, amount: ev.target.value })} />
            </Field>
            <Field label="Payment method">
              <Select value={form.paymentMethod} onChange={(ev) => setForm({ ...form, paymentMethod: ev.target.value })}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Notes">
            <TextArea rows={2} value={form.notes} onChange={(ev) => setForm({ ...form, notes: ev.target.value })} />
          </Field>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Delete expense?"
        message="This expense will be removed permanently."
      />
    </>
  );
}

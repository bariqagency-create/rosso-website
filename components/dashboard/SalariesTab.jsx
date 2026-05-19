'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Users, X } from 'lucide-react';
import { fmtEGP, isoMonth } from '@/lib/format';
import {
  createSalary, updateSalary, deleteSalary, SALARY_PAYMENT_STATUSES,
} from '@/lib/salaries';
import { PAYMENT_METHODS } from '@/lib/bookings';
import {
  StatCard, SectionHeader, Modal, Field, Input, Select, TextArea,
  PrimaryButton, GhostButton, ErrorBanner, ConfirmModal, Empty, cx,
} from './ui';

const empty = {
  employeeName: '', role: '', salaryMonth: isoMonth(),
  amount: 0, amountPaid: 0, paymentStatus: 'unpaid',
  paymentMethod: 'cash', notes: '',
};

const STATUS_COLORS = {
  unpaid: '#FFB020',
  partial: '#3B82F6',
  paid: '#25D366',
};

export default function SalariesTab({ salaries, refresh }) {
  const [monthFilter, setMonthFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    return monthFilter ? salaries.filter(s => s.salaryMonth === monthFilter) : salaries;
  }, [salaries, monthFilter]);

  const stats = useMemo(() => {
    let total = 0, paid = 0;
    for (const s of salaries) { total += s.amount; paid += s.amountPaid; }
    return { total, paid, unpaid: total - paid };
  }, [salaries]);

  const openCreate = () => { setEditing('new'); setForm(empty); setError(''); };
  const openEdit = (s) => { setEditing(s.id); setForm({ ...s }); setError(''); };
  const close = () => { setEditing(null); setError(''); };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      if (!form.employeeName?.trim()) throw new Error('Employee name is required.');
      if (!form.salaryMonth?.trim()) throw new Error('Salary month is required.');
      if (editing === 'new') {
        await createSalary(form);
      } else {
        await updateSalary(editing, form);
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
      await deleteSalary(id);
      await refresh();
      setConfirmDelete(null);
    } catch (e) {
      setError(e?.message || 'Failed to delete.');
    }
  };

  return (
    <>
      <SectionHeader
        eyebrow="SALARIES"
        title="Employee Salaries"
        subtitle="General monthly cost. Labor inside a job stays as full revenue/profit."
        right={<PrimaryButton onClick={openCreate}><Plus size={12} /> Add salary</PrimaryButton>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border-y border-white/10 mb-6">
        <StatCard label="Total salaries" value={fmtEGP(stats.total)} accent="#E10600" />
        <StatCard label="Paid" value={fmtEGP(stats.paid)} accent="#25D366" />
        <StatCard label="Unpaid" value={fmtEGP(stats.unpaid)} accent="#FFB020" />
      </div>

      <div className="bg-gradient-to-br from-[#0F0F0F] to-[#0A0A0A] border border-white/10 p-4 mb-4 flex flex-col md:flex-row md:items-end gap-3">
        <Field label="Filter by month" className="md:max-w-xs flex-1">
          <Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} style={{ colorScheme: 'dark' }} />
        </Field>
        {monthFilter && (
          <button onClick={() => setMonthFilter('')}
                  className="text-[10px] uppercase tracking-widest text-white/60 hover:text-[#E10600] flex items-center gap-1 mb-2">
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Empty icon={<Users size={20} className="text-[#E10600]" />}
               title={salaries.length === 0 ? 'No salary records yet' : 'No matches'}
               hint={salaries.length === 0 ? 'Optional — track monthly salaries here.' : null}
               action={salaries.length === 0 ? <PrimaryButton onClick={openCreate}><Plus size={12} /> Add salary</PrimaryButton> : null} />
      ) : (
        <div className="border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="text-left px-4 py-3 font-normal">Employee</th>
                <th className="text-left px-4 py-3 font-normal">Month</th>
                <th className="text-right px-4 py-3 font-normal">Amount</th>
                <th className="text-right px-4 py-3 font-normal">Paid</th>
                <th className="text-right px-4 py-3 font-normal">Remaining</th>
                <th className="text-left px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const remaining = Math.max(0, s.amount - s.amountPaid);
                const color = STATUS_COLORS[s.paymentStatus] || '#FFFFFF';
                return (
                  <tr key={s.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white">
                      {s.employeeName}
                      {s.role && <div className="text-[10px] text-white/40 uppercase tracking-widest">{s.role}</div>}
                    </td>
                    <td className="px-4 py-3 mono-font text-xs">{s.salaryMonth}</td>
                    <td className="px-4 py-3 text-right mono-font text-xs">{fmtEGP(s.amount)}</td>
                    <td className="px-4 py-3 text-right mono-font text-xs text-[#25D366]">{fmtEGP(s.amountPaid)}</td>
                    <td className="px-4 py-3 text-right mono-font text-xs text-[#FFB020]">{fmtEGP(remaining)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2 py-0.5 border" style={{ borderColor: `${color}55`, color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(s)} className="text-white/50 hover:text-white px-2 py-1"><Edit2 size={12} /></button>
                      <button onClick={() => setConfirmDelete(s.id)} className="text-white/50 hover:text-[#E10600] px-2 py-1"><Trash2 size={12} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={close}
             title={editing === 'new' ? 'Add salary' : 'Edit salary'}
             footer={<>
               <GhostButton onClick={close} disabled={saving}>Cancel</GhostButton>
               <PrimaryButton onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</PrimaryButton>
             </>}>
        <div className="space-y-3">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Employee name *">
              <Input value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} autoFocus />
            </Field>
            <Field label="Role">
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </Field>
            <Field label="Salary month *" hint="YYYY-MM">
              <Input type="month" value={form.salaryMonth} onChange={(e) => setForm({ ...form, salaryMonth: e.target.value })} style={{ colorScheme: 'dark' }} />
            </Field>
            <Field label="Payment method">
              <Select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </Select>
            </Field>
            <Field label="Amount (EGP)">
              <Input type="number" min="0" step="any" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <Field label="Amount paid (EGP)" hint="Status auto-updates from paid / total">
              <Input type="number" min="0" step="any" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
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
        title="Delete salary record?"
        message="This record will be removed permanently."
      />
    </>
  );
}

'use client';

import React, { useState } from 'react';
import { saveBooking, PAYMENT_METHODS } from '@/lib/bookings';
import { updateBooking } from '@/lib/bookings';
import {
  Modal, Field, Input, Select, TextArea, PrimaryButton, GhostButton, ErrorBanner,
} from './ui';

const emptyForm = {
  // Customer
  name: '', phone: '', whatsapp: '', email: '',
  // Vehicle
  brand: '', model: '', year: '', vin: '', plate: '',
  odoIn: '', odoOut: '',
  // Job
  date: '', time: '', location: 'center', description: '', internalNotes: '',
  // Financial
  laborSellingPrice: 0, discount: 0, amountPaid: 0, paymentMethod: 'cash',
};

export default function ManualBookingModal({ open, onClose, refresh }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) { setError('Customer name is required.'); return; }
    if (!form.phone.trim()) { setError('Phone number is required.'); return; }
    if (!form.brand.trim()) { setError('Vehicle brand is required.'); return; }
    if (!form.model.trim()) { setError('Vehicle model is required.'); return; }
    if (!form.description.trim()) { setError('Complaint / service requested is required.'); return; }

    setSaving(true);
    try {
      // Use the existing saveBooking pipeline so the record is identical in
      // shape to website bookings (same id format, top-level summary fields,
      // jsonb payload). We tag it as a manual booking in `data.source`.
      const payload = {
        // Customer
        name:      form.name.trim(),
        phone:     form.phone.trim(),
        whatsapp:  form.whatsapp.trim() || '',
        email:     form.email.trim() || '',
        // Vehicle (stored in jsonb data; vehicle text is recomputed by saveBooking)
        brand: form.brand.trim(),
        model: form.model.trim(),
        year:  form.year.trim() || '',
        vin:   form.vin.trim() || '',
        plate: form.plate.trim() || '',
        odoIn:  form.odoIn || '',
        odoOut: form.odoOut || '',
        // Service
        description:  form.description.trim(),
        quickServices: [],
        needsSpare: null,
        sparePart: { name: '', desc: '', notes: '' },
        // Location
        locationType: form.location || 'center',
        address: '', mapsLink: '', locNotes: '',
        // Appointment
        date: form.date || '',
        time: form.time || '',
        // Source marker
        source: 'manual',
      };

      const record = await saveBooking(payload, { lang: 'en' });

      // Persist the financial / internal fields straight away so the booking
      // appears with the entered values without the admin needing to reopen
      // the Job Cost panel.
      await updateBooking(record.id, {
        laborSellingPrice: Number(form.laborSellingPrice) || 0,
        discount: Number(form.discount) || 0,
        amountPaid: Number(form.amountPaid) || 0,
        paymentMethod: form.paymentMethod || 'cash',
        internalNotes: form.internalNotes || '',
        status: 'new',
      });

      await refresh?.();
      setForm(emptyForm);
      onClose?.();
    } catch (e) {
      setError(e?.message || 'Failed to create booking.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add manual booking / walk-in"
      wide
      footer={
        <>
          <GhostButton onClick={onClose} disabled={saving}>Cancel</GhostButton>
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Create booking'}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-5">
        {error && <ErrorBanner>{error}</ErrorBanner>}

        <Section title="Customer">
          <Field label="Full name *">
            <Input value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
          </Field>
          <Field label="Phone *">
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+20 ..." />
          </Field>
          <Field label="WhatsApp" hint="Leave empty to use phone">
            <Input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </Field>
        </Section>

        <Section title="Vehicle">
          <Field label="Brand *">
            <Input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. BMW" />
          </Field>
          <Field label="Model *">
            <Input value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g. 320i" />
          </Field>
          <Field label="Year">
            <Input value={form.year} onChange={e => set('year', e.target.value)} placeholder="2022" />
          </Field>
          <Field label="Plate number">
            <Input value={form.plate} onChange={e => set('plate', e.target.value)} />
          </Field>
          <Field label="VIN" className="md:col-span-2">
            <Input value={form.vin} onChange={e => set('vin', e.target.value.toUpperCase())} maxLength={17} />
          </Field>
          <Field label="ODO in (km)">
            <Input type="number" min="0" value={form.odoIn} onChange={e => set('odoIn', e.target.value)} />
          </Field>
          <Field label="ODO out (km)">
            <Input type="number" min="0" value={form.odoOut} onChange={e => set('odoOut', e.target.value)} />
          </Field>
        </Section>

        <Section title="Job">
          <Field label="Appointment date">
            <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={{ colorScheme: 'dark' }} />
          </Field>
          <Field label="Appointment time">
            <Input type="time" value={form.time} onChange={e => set('time', e.target.value)} style={{ colorScheme: 'dark' }} />
          </Field>
          <Field label="Location / branch">
            <Select value={form.location} onChange={e => set('location', e.target.value)}>
              <option value="center">Service Center Visit</option>
              <option value="mobile">Mobile / Home Service</option>
            </Select>
          </Field>
          <Field label="Complaint / service requested *" className="md:col-span-2">
            <TextArea rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
          </Field>
          <Field label="Internal notes" className="md:col-span-2">
            <TextArea rows={2} value={form.internalNotes} onChange={e => set('internalNotes', e.target.value)} />
          </Field>
        </Section>

        <Section title="Financial (optional)">
          <Field label="Labor selling price (EGP)">
            <Input type="number" min="0" step="any" value={form.laborSellingPrice} onChange={e => set('laborSellingPrice', e.target.value)} />
          </Field>
          <Field label="Discount (EGP)">
            <Input type="number" min="0" step="any" value={form.discount} onChange={e => set('discount', e.target.value)} />
          </Field>
          <Field label="Amount paid (EGP)">
            <Input type="number" min="0" step="any" value={form.amountPaid} onChange={e => set('amountPaid', e.target.value)} />
          </Field>
          <Field label="Payment method">
            <Select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>
        </Section>
      </div>
    </Modal>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[#E10600] mb-2 flex items-center gap-2">
        <span>{title}</span>
        <span className="h-px flex-1 bg-white/5" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
}

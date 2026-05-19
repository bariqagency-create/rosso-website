import { supabase, supabaseConfigured } from './supabase';

const TABLE = 'salaries';

export const SALARY_PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

function rowToSalary(row) {
  return {
    id: row.id,
    employeeName: row.employee_name || '',
    role: row.role || '',
    salaryMonth: row.salary_month || '',
    amount: Number(row.amount) || 0,
    amountPaid: Number(row.amount_paid) || 0,
    paymentStatus: row.payment_status || 'unpaid',
    paymentMethod: row.payment_method || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function salaryToRow(s) {
  const amount = Number(s.amount) || 0;
  const amountPaid = Math.min(Number(s.amountPaid) || 0, amount);
  const status = amountPaid <= 0
    ? 'unpaid'
    : amountPaid >= amount
      ? 'paid'
      : 'partial';
  return {
    employee_name: s.employeeName?.trim() || '',
    role: s.role?.trim() || null,
    salary_month: s.salaryMonth?.trim() || '',
    amount,
    amount_paid: amountPaid,
    payment_status: status,
    payment_method: s.paymentMethod?.trim() || null,
    notes: s.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

export async function listSalaries() {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('salary_month', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || 'Failed to load salaries.');
  return (data || []).map(rowToSalary);
}

export async function createSalary(s) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  if (!s.employeeName?.trim()) throw new Error('Employee name is required.');
  if (!s.salaryMonth?.trim()) throw new Error('Salary month is required.');
  const { data, error } = await supabase
    .from(TABLE)
    .insert(salaryToRow(s))
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to add salary.');
  return rowToSalary(data);
}

export async function updateSalary(id, s) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from(TABLE)
    .update(salaryToRow(s))
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to update salary.');
  return rowToSalary(data);
}

export async function deleteSalary(id) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete salary.');
}

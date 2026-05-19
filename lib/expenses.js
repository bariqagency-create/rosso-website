import { supabase, supabaseConfigured } from './supabase';

const TABLE = 'expenses';

export const EXPENSE_CATEGORIES = [
  'rent', 'electricity', 'water', 'internet', 'tools',
  'maintenance', 'cleaning', 'marketing', 'supplies', 'transport', 'other'
];

function rowToExpense(row) {
  return {
    id: row.id,
    expenseDate: row.expense_date,
    category: row.category,
    title: row.title || '',
    amount: Number(row.amount) || 0,
    paymentMethod: row.payment_method || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function expenseToRow(e) {
  return {
    expense_date: e.expenseDate || new Date().toISOString().split('T')[0],
    category: e.category || 'other',
    title: e.title?.trim() || '',
    amount: Number(e.amount) || 0,
    payment_method: e.paymentMethod?.trim() || null,
    notes: e.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

export async function listExpenses() {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || 'Failed to load expenses.');
  return (data || []).map(rowToExpense);
}

export async function createExpense(e) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  if (!e.title?.trim()) throw new Error('Expense title is required.');
  if (!EXPENSE_CATEGORIES.includes(e.category)) throw new Error('Invalid category.');
  const { data, error } = await supabase
    .from(TABLE)
    .insert(expenseToRow(e))
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to add expense.');
  return rowToExpense(data);
}

export async function updateExpense(id, e) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from(TABLE)
    .update(expenseToRow(e))
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to update expense.');
  return rowToExpense(data);
}

export async function deleteExpense(id) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete expense.');
}

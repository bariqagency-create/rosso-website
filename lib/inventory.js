import { supabase, supabaseConfigured } from './supabase';

const TABLE = 'inventory_parts';

export const PART_TYPES = ['original', 'aftermarket'];

function rowToPart(row) {
  return {
    id: row.id,
    name: row.name || '',
    partCode: row.part_code || '',
    type: row.type || 'aftermarket',
    brand: row.brand || '',
    quantityAvailable: Number(row.quantity_available) || 0,
    costPrice: Number(row.cost_price) || 0,
    sellingPrice: Number(row.selling_price) || 0,
    minimumStock: Number(row.minimum_stock) || 0,
    supplier: row.supplier || '',
    shelfLocation: row.shelf_location || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function partToRow(p) {
  return {
    name: p.name?.trim(),
    part_code: p.partCode?.trim() || null,
    type: p.type || 'aftermarket',
    brand: p.brand?.trim() || null,
    quantity_available: Number(p.quantityAvailable) || 0,
    cost_price: Number(p.costPrice) || 0,
    selling_price: Number(p.sellingPrice) || 0,
    minimum_stock: Number(p.minimumStock) || 0,
    supplier: p.supplier?.trim() || null,
    shelf_location: p.shelfLocation?.trim() || null,
    notes: p.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

export async function listInventoryParts() {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message || 'Failed to load inventory.');
  return (data || []).map(rowToPart);
}

export async function createInventoryPart(p) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  if (!p.name?.trim()) throw new Error('Part name is required.');
  const { data, error } = await supabase
    .from(TABLE)
    .insert(partToRow(p))
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to add part.');
  return rowToPart(data);
}

export async function updateInventoryPart(id, p) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from(TABLE)
    .update(partToRow(p))
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to update part.');
  return rowToPart(data);
}

export async function deleteInventoryPart(id) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete part.');
}

// Internal helpers used by usedParts.js for atomic stock changes.
export async function _getInventoryQuantity(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('quantity_available')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message || 'Failed to read stock.');
  return Number(data?.quantity_available) || 0;
}

export async function _setInventoryQuantity(id, qty) {
  if (qty < 0) throw new Error('Stock cannot go negative.');
  const { error } = await supabase
    .from(TABLE)
    .update({ quantity_available: qty, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message || 'Failed to update stock.');
}

export function isLowStock(part) {
  const min = Number(part.minimumStock) || 0;
  const qty = Number(part.quantityAvailable) || 0;
  return min > 0 && qty <= min;
}

export function stockValue(part) {
  return (Number(part.quantityAvailable) || 0) * (Number(part.costPrice) || 0);
}

export function expectedSalesValue(part) {
  return (Number(part.quantityAvailable) || 0) * (Number(part.sellingPrice) || 0);
}

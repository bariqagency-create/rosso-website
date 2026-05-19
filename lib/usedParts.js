import { supabase, supabaseConfigured } from './supabase';
import {
  _getInventoryQuantity,
  _setInventoryQuantity,
} from './inventory';

const TABLE = 'booking_used_parts';

function rowToPart(row) {
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function partToRow(p) {
  return {
    booking_id: p.bookingId,
    inventory_part_id: p.inventoryPartId || null,
    part_name: p.partName?.trim() || '',
    part_code: p.partCode?.trim() || null,
    type: p.type || null,
    brand: p.brand?.trim() || null,
    quantity: Number(p.quantity) || 0,
    unit_cost_price: Number(p.unitCostPrice) || 0,
    unit_selling_price: Number(p.unitSellingPrice) || 0,
    notes: p.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

export async function listAllUsedParts() {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message || 'Failed to load used parts.');
  return (data || []).map(rowToPart);
}

export async function listUsedPartsForBooking(bookingId) {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message || 'Failed to load used parts.');
  return (data || []).map(rowToPart);
}

export async function addUsedPart(payload) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  if (!payload.bookingId) throw new Error('Missing booking id.');
  if (!payload.partName?.trim()) throw new Error('Part name is required.');
  const qty = Number(payload.quantity) || 0;
  if (qty <= 0) throw new Error('Quantity must be greater than zero.');

  // If linked to inventory: check stock and reduce it.
  if (payload.inventoryPartId) {
    const available = await _getInventoryQuantity(payload.inventoryPartId);
    if (qty > available) {
      throw new Error(`Not enough stock. Available: ${available}.`);
    }
    await _setInventoryQuantity(payload.inventoryPartId, available - qty);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(partToRow(payload))
    .select()
    .single();

  if (error) {
    // Roll the stock back if insert failed.
    if (payload.inventoryPartId) {
      try {
        const available = await _getInventoryQuantity(payload.inventoryPartId);
        await _setInventoryQuantity(payload.inventoryPartId, available + qty);
      } catch {}
    }
    throw new Error(error.message || 'Failed to add part.');
  }
  return rowToPart(data);
}

export async function updateUsedPart(id, patch) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  // Read existing row
  const { data: existing, error: readErr } = await supabase
    .from(TABLE).select('*').eq('id', id).single();
  if (readErr) throw new Error(readErr.message || 'Used part not found.');
  const prev = rowToPart(existing);

  const next = { ...prev, ...patch };
  const newQty = Number(next.quantity) || 0;
  if (newQty <= 0) throw new Error('Quantity must be greater than zero.');

  // Resolve stock adjustments
  // Case A: same inventory link -> delta adjustment
  if (prev.inventoryPartId && prev.inventoryPartId === next.inventoryPartId) {
    const delta = newQty - prev.quantity;
    if (delta !== 0) {
      const available = await _getInventoryQuantity(prev.inventoryPartId);
      const after = available - delta; // delta > 0 means take more
      if (after < 0) throw new Error(`Not enough stock. Available: ${available}.`);
      await _setInventoryQuantity(prev.inventoryPartId, after);
    }
  } else {
    // Case B: link changed (or removed/added) -> refund old, deduct new
    if (prev.inventoryPartId) {
      const oldAvail = await _getInventoryQuantity(prev.inventoryPartId);
      await _setInventoryQuantity(prev.inventoryPartId, oldAvail + prev.quantity);
    }
    if (next.inventoryPartId) {
      const newAvail = await _getInventoryQuantity(next.inventoryPartId);
      if (newQty > newAvail) {
        // Revert: deduct old refund (best effort) — re-take old stock
        if (prev.inventoryPartId) {
          try {
            const avail2 = await _getInventoryQuantity(prev.inventoryPartId);
            await _setInventoryQuantity(prev.inventoryPartId, avail2 - prev.quantity);
          } catch {}
        }
        throw new Error(`Not enough stock. Available: ${newAvail}.`);
      }
      await _setInventoryQuantity(next.inventoryPartId, newAvail - newQty);
    }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(partToRow(next))
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to update part.');
  return rowToPart(data);
}

export async function deleteUsedPart(id) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  const { data: existing, error: readErr } = await supabase
    .from(TABLE).select('*').eq('id', id).single();
  if (readErr) throw new Error(readErr.message || 'Used part not found.');
  const prev = rowToPart(existing);

  // Refund stock if linked
  if (prev.inventoryPartId) {
    const available = await _getInventoryQuantity(prev.inventoryPartId);
    await _setInventoryQuantity(prev.inventoryPartId, available + prev.quantity);
  }

  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    // Best-effort re-deduct on failure
    if (prev.inventoryPartId) {
      try {
        const available = await _getInventoryQuantity(prev.inventoryPartId);
        await _setInventoryQuantity(prev.inventoryPartId, available - prev.quantity);
      } catch {}
    }
    throw new Error(error.message || 'Failed to delete part.');
  }
}

// ── Totals helpers ─────────────────────────────────────────────
export function partTotals(usedPart) {
  const qty = Number(usedPart.quantity) || 0;
  const totalCost = qty * (Number(usedPart.unitCostPrice) || 0);
  const totalSelling = qty * (Number(usedPart.unitSellingPrice) || 0);
  return {
    totalCost,
    totalSelling,
    profit: totalSelling - totalCost,
  };
}

export function bookingJobTotals(booking, usedParts = []) {
  let totalPartsCost = 0;
  let totalPartsSelling = 0;
  for (const p of usedParts) {
    const t = partTotals(p);
    totalPartsCost += t.totalCost;
    totalPartsSelling += t.totalSelling;
  }
  const labor = Number(booking?.laborSellingPrice) || 0;
  const discount = Number(booking?.discount) || 0;
  const amountPaid = Number(booking?.amountPaid) || 0;

  const totalPartsProfit = totalPartsSelling - totalPartsCost;
  const totalInvoice = Math.max(0, totalPartsSelling + labor - discount);
  const grossProfit = totalInvoice - totalPartsCost;
  const amountRemaining = Math.max(0, totalInvoice - amountPaid);

  return {
    totalPartsCost,
    totalPartsSelling,
    totalPartsProfit,
    laborSellingPrice: labor,
    laborProfit: labor,
    discount,
    totalInvoice,
    totalJobCost: totalPartsCost,
    grossProfit,
    amountPaid,
    amountRemaining,
  };
}

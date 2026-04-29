const { z } = require('zod')

const movementBody = z.object({
  kind: z.enum(['purchase', 'consumption', 'adjustment', 'waste']),
  qty: z.coerce.number().positive(),
  unit_cost: z.coerce.number().nonnegative().optional().nullable(),
  reference: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  create_purchase: z.boolean().optional(),
  purchase_total: z.coerce.number().nonnegative().optional().nullable(),
})

function mapMovement(kind, qty) {
  switch (kind) {
    case 'purchase':
      return { movement_type: 'purchase_in', qty_signed: qty }
    case 'consumption':
      return { movement_type: 'sale_out', qty_signed: -qty }
    case 'waste':
      return { movement_type: 'waste', qty_signed: -qty }
    case 'adjustment':
      return { movement_type: 'adjustment', qty_signed: qty }
    default:
      return { movement_type: 'adjustment', qty_signed: qty }
  }
}

async function itemWithSupplier(supabase, row) {
  let supplierName = null
  if (row.supplier_id) {
    const { data: s } = await supabase
      .from('suppliers')
      .select('nombre')
      .eq('id', row.supplier_id)
      .maybeSingle()
    supplierName = s?.nombre ?? null
  }
  return {
    id: row.id,
    sku: row.sku,
    name: row.nombre,
    unit: row.base_unit,
    category: row.category,
    supplier_id: row.supplier_id,
    supplier_name: supplierName,
    cost_per_unit: row.avg_unit_cost,
    stock_qty: row.stock_actual,
    reorder_point: row.stock_min,
    reorder_qty: row.reorder_qty ?? 0,
    active: row.active,
  }
}

async function listInventory(supabase, query) {
  const qStr = query.q
  const category = query.category
  const low = query.low_stock === '1' || query.low_stock === 'true'
  if (low) {
    let qv = supabase.from('v_inventory_status').select('*').eq('needs_reorder', true)
    if (qStr) qv = qv.ilike('name', `%${qStr}%`)
    if (category) qv = qv.eq('category', category)
    qv = qv.order('suggested_qty', { ascending: false })
    const { data: rows, error } = await qv
    if (error) throw error
    const items = []
    for (const r of rows || []) {
      let supplierName = null
      if (r.supplier_id) {
        const { data: s } = await supabase
          .from('suppliers')
          .select('nombre')
          .eq('id', r.supplier_id)
          .maybeSingle()
        supplierName = s?.nombre ?? null
      }
      items.push({
        id: r.id,
        sku: r.sku,
        name: r.name,
        unit: r.unit,
        category: r.category,
        supplier_id: r.supplier_id,
        supplier_name: supplierName,
        cost_per_unit: r.cost_per_unit,
        stock_qty: r.stock_qty,
        reorder_point: r.reorder_point,
        reorder_qty: r.reorder_qty,
        active: r.active,
        needs_reorder: r.needs_reorder,
        suggested_qty: r.suggested_qty,
      })
    }
    return { items }
  }

  let q = supabase.from('inventory_items').select('*').order('nombre', { ascending: true })
  if (qStr) q = q.ilike('nombre', `%${qStr}%`)
  if (category) q = q.eq('category', category)
  const { data, error } = await q
  if (error) throw error
  const items = []
  for (const row of data || []) {
    items.push(await itemWithSupplier(supabase, row))
  }
  return { items }
}

async function createInventoryItem(supabase, body) {
  const row = {
    sku: body.sku || null,
    nombre: body.name || body.nombre,
    base_unit: body.unit || body.base_unit || 'pza',
    category: body.category || null,
    supplier_id: body.supplier_id || null,
    stock_actual: body.stock_qty ?? body.stock_actual ?? 0,
    stock_min: body.reorder_point ?? body.stock_min ?? 0,
    reorder_qty: body.reorder_qty ?? 0,
    avg_unit_cost: body.cost_per_unit ?? body.avg_unit_cost ?? 0,
    active: body.active !== false,
  }
  if (!row.nombre) {
    const e = new Error('Nombre requerido')
    e.status = 400
    throw e
  }
  const { data, error } = await supabase
    .from('inventory_items')
    .insert(row)
    .select('*')
    .single()
  if (error) throw error
  return itemWithSupplier(supabase, data)
}

async function updateInventoryItem(supabase, id, body) {
  const uuid = z.string().uuid().parse(id)
  const patch = {}
  if (body.sku !== undefined) patch.sku = body.sku
  if (body.name !== undefined) patch.nombre = body.name
  if (body.unit !== undefined) patch.base_unit = body.unit
  if (body.category !== undefined) patch.category = body.category
  if (body.supplier_id !== undefined) patch.supplier_id = body.supplier_id
  if (body.stock_qty !== undefined) patch.stock_actual = body.stock_qty
  if (body.reorder_point !== undefined) patch.stock_min = body.reorder_point
  if (body.reorder_qty !== undefined) patch.reorder_qty = body.reorder_qty
  if (body.cost_per_unit !== undefined) patch.avg_unit_cost = body.cost_per_unit
  if (body.active !== undefined) patch.active = body.active
  patch.updated_at = new Date().toISOString()
  const { data, error } = await supabase
    .from('inventory_items')
    .update(patch)
    .eq('id', uuid)
    .select('*')
    .single()
  if (error) throw error
  return itemWithSupplier(supabase, data)
}

async function listReorder(supabase) {
  const { data, error } = await supabase
    .from('v_inventory_status')
    .select('*')
    .eq('needs_reorder', true)
    .order('suggested_qty', { ascending: false })
  if (error) throw error
  const rows = data || []
  const out = []
  for (const r of rows) {
    let supplierName = null
    if (r.supplier_id) {
      const { data: s } = await supabase
        .from('suppliers')
        .select('nombre')
        .eq('id', r.supplier_id)
        .maybeSingle()
      supplierName = s?.nombre ?? null
    }
    out.push({ ...r, supplier_name: supplierName })
  }
  return { items: out }
}

async function listMovements(supabase, query) {
  const itemId = query.item_id
  const from = query.from
  const to = query.to
  let q = supabase.from('inventory_movements').select('*').order('created_at', { ascending: false }).limit(500)
  if (itemId) q = q.eq('inventory_item_id', itemId)
  if (typeof from === 'string' && from) q = q.gte('created_at', `${from}T00:00:00-06:00`)
  if (typeof to === 'string' && to) q = q.lte('created_at', `${to}T23:59:59-06:00`)
  const { data, error } = await q
  if (error) throw error
  return { movements: data || [] }
}

async function createMovement(supabase, itemId, body, userId) {
  const id = z.string().uuid().parse(itemId)
  const parsed = movementBody.parse(body || {})
  const m = mapMovement(parsed.kind, parsed.qty)
  const ins = {
    inventory_item_id: id,
    movement_type: m.movement_type,
    qty_signed: m.qty_signed,
    unit_cost: parsed.unit_cost ?? null,
    reference_order_id: null,
    reference_po_id: null,
    waste_reason: parsed.note || null,
    reference: parsed.reference || null,
    user_id: userId || null,
  }
  const { data: movement, error: me } = await supabase
    .from('inventory_movements')
    .insert(ins)
    .select('*')
    .single()
  if (me) throw me

  if (parsed.kind === 'purchase' && parsed.create_purchase) {
    const { data: item } = await supabase.from('inventory_items').select('supplier_id').eq('id', id).single()
    const total =
      parsed.purchase_total != null ? parsed.purchase_total : (parsed.unit_cost || 0) * parsed.qty
    await supabase.from('purchases').insert({
      supplier_id: item?.supplier_id ?? null,
      invoice: parsed.reference || null,
      total,
      user_id: userId || null,
      note: parsed.note || null,
    })
  }

  return movement
}

async function listSuppliers(supabase) {
  const { data: spendRows } = await supabase.from('v_supplier_purchases').select('id, total_30d')
  const spendBy = new Map((spendRows || []).map((r) => [r.id, Number(r.total_30d) || 0]))

  const { data, error } = await supabase.from('suppliers').select('*').order('nombre', { ascending: true })
  if (error) throw error
  return {
    suppliers: (data || []).map((s) => ({
      id: s.id,
      name: s.nombre,
      contact: s.contacto,
      phone: s.telefono,
      email: s.email ?? null,
      notes: s.notes ?? null,
      active: s.active !== false,
      created_at: s.created_at,
      total_30d: spendBy.get(s.id) ?? 0,
    })),
  }
}

async function createSupplier(supabase, body) {
  if (!body.name) {
    const e = new Error('Nombre requerido')
    e.status = 400
    throw e
  }
  const row = {
    nombre: body.name,
    contacto: body.contact || null,
    telefono: body.phone || null,
    email: body.email || null,
    notes: body.notes || null,
    active: body.active !== false,
  }
  const { data, error } = await supabase.from('suppliers').insert(row).select('*').single()
  if (error) throw error
  return {
    id: data.id,
    name: data.nombre,
    contact: data.contacto,
    phone: data.telefono,
    email: data.email,
    notes: data.notes,
    active: data.active !== false,
  }
}

async function updateSupplier(supabase, id, body) {
  const uuid = z.string().uuid().parse(id)
  const patch = {}
  if (body.name !== undefined) patch.nombre = body.name
  if (body.contact !== undefined) patch.contacto = body.contact
  if (body.phone !== undefined) patch.telefono = body.phone
  if (body.email !== undefined) patch.email = body.email
  if (body.notes !== undefined) patch.notes = body.notes
  if (body.active !== undefined) patch.active = body.active
  const { data, error } = await supabase.from('suppliers').update(patch).eq('id', uuid).select('*').single()
  if (error) throw error
  return {
    id: data.id,
    name: data.nombre,
    contact: data.contacto,
    phone: data.telefono,
    email: data.email,
    notes: data.notes,
    active: data.active !== false,
  }
}

module.exports = {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  listReorder,
  listMovements,
  createMovement,
  listSuppliers,
  createSupplier,
  updateSupplier,
  itemWithSupplier,
}

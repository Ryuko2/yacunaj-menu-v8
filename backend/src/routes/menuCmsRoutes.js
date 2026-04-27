const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const { z } = require('zod')
const { supabase } = require('../services/supabase')
const { requireSupabaseUser, requireStaffProfile, requireRole } = require('../middleware/auth')
const schemas = require('../schemas/menu')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
    cb(ok ? null : new Error('Tipo de archivo no permitido'), ok)
  },
})

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET_MENU || 'menu-images'

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.setHeader('Pragma', 'no-cache')
}

const router = express.Router()

const staffRead = [requireSupabaseUser, requireStaffProfile]
const managerWrite = [...staffRead, requireRole('owner', 'manager')]

/** GET /menu/admin — árbol completo (incluye inactivos / agotados) */
router.get('/menu/admin', ...staffRead, async (req, res) => {
  noStore(res)
  try {
    const previewAt = req.query.previewAt ? new Date(String(req.query.previewAt)) : new Date()
    const { data: cats, error: e1 } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    if (e1) throw e1
    const { data: items, error: e2 } = await supabase.from('menu_items').select('*').order('sort_order')
    if (e2) throw e2
    const { data: groups, error: e3 } = await supabase.from('modifier_groups').select('*').order('sort_order')
    if (e3) throw e3
    const { data: mods, error: e4 } = await supabase.from('modifiers').select('*').order('sort_order')
    if (e4) throw e4
    const { data: links, error: e5 } = await supabase.from('menu_item_modifier_groups').select('*')
    if (e5) throw e5
    return res.json({
      previewAt: previewAt.toISOString(),
      categories: cats || [],
      menu_items: items || [],
      modifier_groups: groups || [],
      modifiers: mods || [],
      menu_item_modifier_groups: links || [],
    })
  } catch (e) {
    console.error('[menu/admin]', e)
    return res.status(500).json({ error: e.message })
  }
})

/** Categorías */
router.get('/menu/categories', ...staffRead, async (req, res) => {
  noStore(res)
  const { data, error } = await supabase.from('categories').select('*').order('sort_order')
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ categories: data || [] })
})

router.post('/menu/categories', ...managerWrite, async (req, res) => {
  const body = schemas.categoryCreate.parse(req.body)
  const { data, error } = await supabase.from('categories').insert(body).select('*').single()
  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json(data)
})

router.patch('/menu/categories/reorder', ...managerWrite, async (req, res) => {
  const rows = schemas.categoryReorder.parse(req.body)
  for (const r of rows) {
    const patch = { sort_order: r.sort_order }
    if (r.parent_id !== undefined) patch.parent_id = r.parent_id
    const { error } = await supabase.from('categories').update(patch).eq('id', r.id)
    if (error) return res.status(400).json({ error: error.message })
  }
  return res.json({ ok: true })
})

router.patch('/menu/categories/:id', ...managerWrite, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const patch = schemas.categoryPatch.parse(req.body)
  const { data, error } = await supabase.from('categories').update(patch).eq('id', id).select('*').single()
  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
})

router.delete('/menu/categories/:id', ...managerWrite, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return res.status(400).json({ error: error.message })
  return res.status(204).end()
})

/** Items */
router.get('/menu/items', ...staffRead, async (req, res) => {
  noStore(res)
  const page = Math.max(1, parseInt(req.query.page || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)))
  const from = (page - 1) * limit
  const to = from + limit - 1
  let q = supabase.from('menu_items').select('*', { count: 'exact' }).order('sort_order').range(from, to)
  if (req.query.category_id) q = q.eq('category_id', req.query.category_id)
  if (req.query.q) q = q.ilike('name', `%${req.query.q}%`)
  if (req.query.active === 'true') q = q.eq('active', true)
  if (req.query.active === 'false') q = q.eq('active', false)
  const { data, error, count } = await q
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ items: data || [], page, limit, total: count ?? data?.length ?? 0 })
})

router.patch('/menu/items/reorder', ...managerWrite, async (req, res) => {
  const rows = schemas.itemReorder.parse(req.body)
  for (const r of rows) {
    const { error } = await supabase.from('menu_items').update({ sort_order: r.sort_order }).eq('id', r.id)
    if (error) return res.status(400).json({ error: error.message })
  }
  return res.json({ ok: true })
})

router.get('/menu/items/:id', ...staffRead, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const { data: item, error } = await supabase.from('menu_items').select('*').eq('id', id).maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!item) return res.status(404).json({ error: 'No encontrado' })
  const { data: links } = await supabase.from('menu_item_modifier_groups').select('*').eq('menu_item_id', id)
  const { data: recipes } = await supabase.from('recipes').select('*').eq('menu_item_id', id)
  let recipe_lines = []
  if (recipes?.length) {
    const rid = recipes.map((r) => r.id)
    const { data: lines } = await supabase.from('recipe_lines').select('*').in('recipe_id', rid)
    recipe_lines = lines || []
  }
  const { data: priceLog } = await supabase
    .from('price_changes_log')
    .select('*')
    .eq('menu_item_id', id)
    .order('created_at', { ascending: false })
    .limit(50)
  return res.json({ item, modifier_group_links: links || [], recipes: recipes || [], recipe_lines: recipe_lines || [], price_changes: priceLog || [] })
})

router.post('/menu/items', ...managerWrite, async (req, res) => {
  const body = schemas.menuItemCreate.parse(req.body)
  const { modifier_group_ids, ...rest } = body
  if (!rest.category_id && !rest.category) rest.category = 'food'
  const { data: item, error } = await supabase.from('menu_items').insert(rest).select('*').single()
  if (error) return res.status(400).json({ error: error.message })
  if (modifier_group_ids?.length) {
    const rows = modifier_group_ids.map((gid, i) => ({
      menu_item_id: item.id,
      modifier_group_id: gid,
      sort_order: i * 10,
    }))
    await supabase.from('menu_item_modifier_groups').insert(rows)
  }
  return res.status(201).json(item)
})

router.patch('/menu/items/:id', ...managerWrite, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const body = schemas.menuItemPatch.parse(req.body)
  const { modifier_group_ids, ...rest } = body
  const { data, error } = await supabase.from('menu_items').update(rest).eq('id', id).select('*').single()
  if (error) return res.status(400).json({ error: error.message })
  if (modifier_group_ids) {
    await supabase.from('menu_item_modifier_groups').delete().eq('menu_item_id', id)
    const rows = modifier_group_ids.map((gid, i) => ({
      menu_item_id: id,
      modifier_group_id: gid,
      sort_order: i * 10,
    }))
    if (rows.length) await supabase.from('menu_item_modifier_groups').insert(rows)
  }
  return res.json(data)
})

router.delete('/menu/items/:id', ...managerWrite, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  if (req.query.hard === '1') {
    const { count, error: cErr } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('menu_item_id', id)
    if (cErr) return res.status(500).json({ error: cErr.message })
    if (count && count > 0) {
      return res.status(409).json({
        error: 'no se puede borrar; usar desactivar',
        detail: 'El producto aparece en pedidos.',
      })
    }
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(204).end()
  }
  const { data, error } = await supabase.from('menu_items').update({ active: false }).eq('id', id).select('*').single()
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ soft_deleted: true, item: data })
})

router.patch('/menu/items/:id/price', ...managerWrite, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const { price, reason } = schemas.priceBody.parse(req.body)
  const { data, error } = await supabase.rpc('menu_item_set_price', {
    p_id: id,
    p_price: price,
    p_user_id: req.user.id,
    p_reason: reason,
  })
  if (error) return res.status(400).json({ error: error.message })
  const row = Array.isArray(data) ? data[0] : data
  return res.json(row)
})

router.patch('/menu/items/:id/toggle-availability', ...managerWrite, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const { out_of_stock } = schemas.toggleAvail.parse(req.body)
  const { data, error } = await supabase.from('menu_items').update({ out_of_stock }).eq('id', id).select('*').single()
  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
})

router.post('/menu/items/:id/clone', ...managerWrite, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const { data: src, error } = await supabase.from('menu_items').select('*').eq('id', id).single()
  if (error || !src) return res.status(404).json({ error: 'No encontrado' })
  const { id: _id, created_at: _c, ...copy } = src
  const insert = { ...copy, name: `${src.name} (copia)`, slug: null, sku: null }
  const { data: created, error: e2 } = await supabase.from('menu_items').insert(insert).select('*').single()
  if (e2) return res.status(400).json({ error: e2.message })
  const { data: links } = await supabase.from('menu_item_modifier_groups').select('*').eq('menu_item_id', id)
  if (links?.length) {
    const newLinks = links.map((l) => ({
      menu_item_id: created.id,
      modifier_group_id: l.modifier_group_id,
      required_override: l.required_override,
      sort_order: l.sort_order,
    }))
    await supabase.from('menu_item_modifier_groups').insert(newLinks)
  }
  return res.status(201).json(created)
})

router.post('/menu/items/:id/image', ...managerWrite, upload.single('file'), async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  if (!req.file) return res.status(400).json({ error: 'Falta archivo (field: file)' })
  try {
    const webp = await sharp(req.file.buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()
    const ts = Date.now()
    const path = `items/${id}/${ts}.webp`
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, webp, {
      contentType: 'image/webp',
      upsert: true,
    })
    if (upErr) return res.status(400).json({ error: upErr.message })
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return res.json({ url: pub.publicUrl, path })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
})

router.delete('/menu/items/:id/image', ...managerWrite, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const { url } = schemas.deleteImageBody.parse(req.body)
  const prefix = `/storage/v1/object/public/${BUCKET}/`
  const idx = url.indexOf(prefix)
  if (idx === -1) return res.status(400).json({ error: 'URL no pertenece al bucket' })
  const objectPath = url.slice(idx + prefix.length)
  const { error } = await supabase.storage.from(BUCKET).remove([objectPath])
  if (error) return res.status(400).json({ error: error.message })
  const { data: item } = await supabase.from('menu_items').select('image_url').eq('id', id).single()
  if (item?.image_url === url) {
    await supabase.from('menu_items').update({ image_url: null }).eq('id', id)
  }
  return res.json({ ok: true })
})

router.get('/menu/items/:id/preview-price', ...staffRead, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const raw = String(req.query.modifiers || '')
  const ids = raw
    ? raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    : []
  for (const x of ids) z.string().uuid().parse(x)
  const { data, error } = await supabase.rpc('fn_final_item_price', {
    p_menu_item_id: id,
    p_modifier_ids: ids,
  })
  if (error) return res.status(400).json({ error: error.message })
  return res.json({ final_price: data })
})

/** Modifier groups */
router.get('/menu/modifier-groups', ...staffRead, async (req, res) => {
  noStore(res)
  const { data, error } = await supabase.from('modifier_groups').select('*').order('sort_order')
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ modifier_groups: data || [] })
})

router.post('/menu/modifier-groups', ...managerWrite, async (req, res) => {
  const body = schemas.modifierGroupCreate.parse(req.body)
  const { data, error } = await supabase.from('modifier_groups').insert(body).select('*').single()
  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json(data)
})

router.patch('/menu/modifier-groups/:id', ...managerWrite, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const body = schemas.modifierGroupPatch.parse(req.body)
  const { data, error } = await supabase.from('modifier_groups').update(body).eq('id', id).select('*').single()
  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
})

router.delete('/menu/modifier-groups/:id', ...managerWrite, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const { error } = await supabase.from('modifier_groups').delete().eq('id', id)
  if (error) return res.status(400).json({ error: error.message })
  return res.status(204).end()
})

/** Modifiers */
router.get('/menu/modifiers', ...staffRead, async (req, res) => {
  noStore(res)
  let q = supabase.from('modifiers').select('*').order('sort_order')
  if (req.query.group_id) q = q.eq('modifier_group_id', req.query.group_id)
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ modifiers: data || [] })
})

router.post('/menu/modifiers', ...managerWrite, async (req, res) => {
  const body = schemas.modifierCreate.parse(req.body)
  const { data, error } = await supabase.from('modifiers').insert(body).select('*').single()
  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json(data)
})

router.patch('/menu/modifiers/:id', ...managerWrite, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const body = schemas.modifierPatch.parse(req.body)
  if (body.price_extra !== undefined && body.price_extra !== null) {
    const reason = req.body.price_reason || req.body.reason
    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({ error: 'Se requiere reason o price_reason (mín. 5 caracteres) para cambiar precio_extra' })
    }
    const { data, error } = await supabase.rpc('modifier_set_price_extra', {
      p_id: id,
      p_price_extra: body.price_extra,
      p_user_id: req.user.id,
      p_reason: String(reason),
    })
    if (error) return res.status(400).json({ error: error.message })
    const rest = { ...body }
    delete rest.price_extra
    delete rest.modifier_group_id
    if (Object.keys(rest).length) {
      const { data: updated, error: e2 } = await supabase.from('modifiers').update(rest).eq('id', id).select('*').single()
      if (e2) return res.status(400).json({ error: e2.message })
      return res.json(updated)
    }
    const row = Array.isArray(data) ? data[0] : data
    return res.json(row)
  }
  const { data, error } = await supabase.from('modifiers').update(body).eq('id', id).select('*').single()
  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
})

router.delete('/menu/modifiers/:id', ...managerWrite, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id)
  const { error } = await supabase.from('modifiers').delete().eq('id', id)
  if (error) return res.status(400).json({ error: error.message })
  return res.status(204).end()
})

/** Links item <-> modifier groups */
router.post('/menu/items/:id/modifier-groups', ...managerWrite, async (req, res) => {
  const menu_item_id = z.string().uuid().parse(req.params.id)
  const body = schemas.attachGroupBody.parse(req.body)
  const { data, error } = await supabase
    .from('menu_item_modifier_groups')
    .insert({
      menu_item_id,
      modifier_group_id: body.modifier_group_id,
      required_override: body.required_override ?? null,
      sort_order: body.sort_order ?? 0,
    })
    .select('*')
    .single()
  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json(data)
})

router.patch('/menu/items/:id/modifier-groups/reorder', ...managerWrite, async (req, res) => {
  const menu_item_id = z.string().uuid().parse(req.params.id)
  const rows = schemas.modifierGroupReorder.parse(req.body)
  for (const r of rows) {
    const { error } = await supabase
      .from('menu_item_modifier_groups')
      .update({ sort_order: r.sort_order })
      .eq('menu_item_id', menu_item_id)
      .eq('modifier_group_id', r.modifier_group_id)
    if (error) return res.status(400).json({ error: error.message })
  }
  return res.json({ ok: true })
})

router.delete('/menu/items/:id/modifier-groups/:groupId', ...managerWrite, async (req, res) => {
  const menu_item_id = z.string().uuid().parse(req.params.id)
  const modifier_group_id = z.string().uuid().parse(req.params.groupId)
  const { error } = await supabase
    .from('menu_item_modifier_groups')
    .delete()
    .eq('menu_item_id', menu_item_id)
    .eq('modifier_group_id', modifier_group_id)
  if (error) return res.status(400).json({ error: error.message })
  return res.status(204).end()
})

module.exports = router

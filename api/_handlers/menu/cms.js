/**
 * CMS menú — paridad con backend/src/routes/menuCmsRoutes.js para Vercel (Bearer + service role).
 */
import busboy from 'busboy'
import sharp from 'sharp'
import { ZodError, z } from 'zod'
import { supabase } from '../../_supabase.js'
import { getStaffUserFromRequest } from '../../_auth.js'
import * as schemas from '../../_schemas/menuCms.js'

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET_MENU || 'menu-images'

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

function isUuid(s) {
  return typeof s === 'string' && UUID_RE.test(s)
}

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.setHeader('Pragma', 'no-cache')
}

function jsonBody(req) {
  const b = req.body
  if (b == null) return {}
  if (typeof b === 'string') {
    try {
      return JSON.parse(b)
    } catch {
      return {}
    }
  }
  return b
}

function errRes(res, status, msg, detail) {
  return res.status(status).json({ error: msg, ...(detail ? { detail } : {}) })
}

function requireManager(profile) {
  if (!['owner', 'manager'].includes(profile.role)) {
    throw { status: 403, error: 'Permisos insuficientes', roles: 'owner, manager' }
  }
}

async function parseMultipartFile(req) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers, limits: { fileSize: 5 * 1024 * 1024 } })
    const files = []
    bb.on('file', (name, file, info) => {
      const chunks = []
      file.on('data', (d) => chunks.push(d))
      file.on('limit', () => reject(new Error('Archivo demasiado grande')))
      file.on('end', () => {
        files.push({
          field: name,
          buffer: Buffer.concat(chunks),
          mimeType: info.mimeType,
          filename: info.filename,
        })
      })
    })
    bb.on('error', reject)
    bb.on('finish', () => resolve(files))
    if (req.readable && !req.readableEnded) {
      req.pipe(bb)
    } else if (req.body) {
      const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body))
      bb.end(buf)
    } else {
      reject(new Error('No se pudo leer el cuerpo multipart'))
    }
  })
}

/** @param {import('@supabase/supabase-js').User} user */
function itemImagePost(req, res, itemId) {
  return (async () => {
    const files = await parseMultipartFile(req)
    const file = files.find((f) => f.field === 'file') || files[0]
    if (!file?.buffer?.length) return errRes(res, 400, 'Falta archivo (field: file)')
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimeType)
    if (!ok) return errRes(res, 400, 'Tipo de archivo no permitido')
    const webp = await sharp(file.buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()
    const ts = Date.now()
    const path = `items/${itemId}/${ts}.webp`
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, webp, {
      contentType: 'image/webp',
      upsert: true,
    })
    if (upErr) return errRes(res, 400, upErr.message)
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return res.json({ url: pub.publicUrl, path })
  })().catch((e) => errRes(res, 500, e.message))
}

export async function dispatchMenuCms(req, res, segs) {
  noStore(res)
  let user
  let profile
  try {
    ;({ user, profile } = await getStaffUserFromRequest(req))
  } catch (e) {
    const st = e?.status ?? 401
    return res.status(st).json({ error: e?.error, detail: e?.detail })
  }

  const method = req.method
  if (method === 'OPTIONS') return res.status(204).end()

  const s = segs.slice(1)

  try {
    // --- GET /menu/admin
    if (s.length === 1 && s[0] === 'admin' && method === 'GET') {
      const previewAt = req.query.previewAt ? new Date(String(req.query.previewAt)) : new Date()
      const { data: cats, error: e1 } = await supabase.from('categories').select('*').order('sort_order', { ascending: true })
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
    }

    // --- categories/reorder
    if (s.length === 2 && s[0] === 'categories' && s[1] === 'reorder' && method === 'PATCH') {
      requireManager(profile)
      const body = schemas.categoryReorder.parse(jsonBody(req))
      for (const r of body) {
        const patch = { sort_order: r.sort_order }
        if (r.parent_id !== undefined) patch.parent_id = r.parent_id
        const { error } = await supabase.from('categories').update(patch).eq('id', r.id)
        if (error) return errRes(res, 400, error.message)
      }
      return res.json({ ok: true })
    }

    // --- categories/:id
    if (s.length === 2 && s[0] === 'categories' && isUuid(s[1])) {
      const id = s[1]
      if (method === 'PATCH') {
        requireManager(profile)
        const patch = schemas.categoryPatch.parse(jsonBody(req))
        const { data, error } = await supabase.from('categories').update(patch).eq('id', id).select('*').single()
        if (error) return errRes(res, 400, error.message)
        return res.json(data)
      }
      if (method === 'DELETE') {
        requireManager(profile)
        const { error } = await supabase.from('categories').delete().eq('id', id)
        if (error) return errRes(res, 400, error.message)
        return res.status(204).end()
      }
    }

    // --- categories
    if (s.length === 1 && s[0] === 'categories') {
      if (method === 'GET') {
        const { data, error } = await supabase.from('categories').select('*').order('sort_order')
        if (error) return errRes(res, 500, error.message)
        return res.json({ categories: data || [] })
      }
      if (method === 'POST') {
        requireManager(profile)
        const body = schemas.categoryCreate.parse(jsonBody(req))
        const { data, error } = await supabase.from('categories').insert(body).select('*').single()
        if (error) return errRes(res, 400, error.message)
        return res.status(201).json(data)
      }
    }

    // --- items/reorder
    if (s.length === 2 && s[0] === 'items' && s[1] === 'reorder' && method === 'PATCH') {
      requireManager(profile)
      const rows = schemas.itemReorder.parse(jsonBody(req))
      for (const r of rows) {
        const { error } = await supabase.from('menu_items').update({ sort_order: r.sort_order }).eq('id', r.id)
        if (error) return errRes(res, 400, error.message)
      }
      return res.json({ ok: true })
    }

    // --- items/:id/modifier-groups/reorder
    if (s.length === 4 && s[0] === 'items' && isUuid(s[1]) && s[2] === 'modifier-groups' && s[3] === 'reorder' && method === 'PATCH') {
      requireManager(profile)
      const menu_item_id = s[1]
      const rows = schemas.modifierGroupReorder.parse(jsonBody(req))
      for (const r of rows) {
        const { error } = await supabase
          .from('menu_item_modifier_groups')
          .update({ sort_order: r.sort_order })
          .eq('menu_item_id', menu_item_id)
          .eq('modifier_group_id', r.modifier_group_id)
        if (error) return errRes(res, 400, error.message)
      }
      return res.json({ ok: true })
    }

    // --- items/:id/modifier-groups/:groupId DELETE
    if (s.length === 4 && s[0] === 'items' && isUuid(s[1]) && s[2] === 'modifier-groups' && isUuid(s[3]) && method === 'DELETE') {
      requireManager(profile)
      const menu_item_id = s[1]
      const modifier_group_id = s[3]
      const { error } = await supabase
        .from('menu_item_modifier_groups')
        .delete()
        .eq('menu_item_id', menu_item_id)
        .eq('modifier_group_id', modifier_group_id)
      if (error) return errRes(res, 400, error.message)
      return res.status(204).end()
    }

    // --- items/:id/modifier-groups POST
    if (s.length === 3 && s[0] === 'items' && isUuid(s[1]) && s[2] === 'modifier-groups' && method === 'POST') {
      requireManager(profile)
      const menu_item_id = s[1]
      const body = schemas.attachGroupBody.parse(jsonBody(req))
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
      if (error) return errRes(res, 400, error.message)
      return res.status(201).json(data)
    }

    // --- items/:id/price
    if (s.length === 3 && s[0] === 'items' && isUuid(s[1]) && s[2] === 'price' && method === 'PATCH') {
      requireManager(profile)
      const id = s[1]
      const { price, reason } = schemas.priceBody.parse(jsonBody(req))
      const { data, error } = await supabase.rpc('menu_item_set_price', {
        p_id: id,
        p_price: price,
        p_user_id: user.id,
        p_reason: reason,
      })
      if (error) return errRes(res, 400, error.message)
      const row = Array.isArray(data) ? data[0] : data
      return res.json(row)
    }

    // --- items/:id/toggle-availability
    if (s.length === 3 && s[0] === 'items' && isUuid(s[1]) && s[2] === 'toggle-availability' && method === 'PATCH') {
      requireManager(profile)
      const id = s[1]
      const { out_of_stock } = schemas.toggleAvail.parse(jsonBody(req))
      const { data, error } = await supabase.from('menu_items').update({ out_of_stock }).eq('id', id).select('*').single()
      if (error) return errRes(res, 400, error.message)
      return res.json(data)
    }

    // --- items/:id/clone
    if (s.length === 3 && s[0] === 'items' && isUuid(s[1]) && s[2] === 'clone' && method === 'POST') {
      requireManager(profile)
      const id = s[1]
      const { data: src, error } = await supabase.from('menu_items').select('*').eq('id', id).single()
      if (error || !src) return errRes(res, 404, 'No encontrado')
      const { id: _id, created_at: _c, ...copy } = src
      const insert = { ...copy, name: `${src.name} (copia)`, slug: null, sku: null }
      const { data: created, error: e2 } = await supabase.from('menu_items').insert(insert).select('*').single()
      if (e2) return errRes(res, 400, e2.message)
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
    }

    // --- items/:id/image
    if (s.length === 3 && s[0] === 'items' && isUuid(s[1]) && s[2] === 'image') {
      const id = s[1]
      if (method === 'POST') {
        requireManager(profile)
        return itemImagePost(req, res, id)
      }
      if (method === 'DELETE') {
        requireManager(profile)
        const { url } = schemas.deleteImageBody.parse(jsonBody(req))
        const prefix = `/storage/v1/object/public/${BUCKET}/`
        const idx = url.indexOf(prefix)
        if (idx === -1) return errRes(res, 400, 'URL no pertenece al bucket')
        const objectPath = url.slice(idx + prefix.length)
        const { error } = await supabase.storage.from(BUCKET).remove([objectPath])
        if (error) return errRes(res, 400, error.message)
        const { data: item } = await supabase.from('menu_items').select('image_url').eq('id', id).single()
        if (item?.image_url === url) {
          await supabase.from('menu_items').update({ image_url: null }).eq('id', id)
        }
        return res.json({ ok: true })
      }
    }

    // --- items/:id/preview-price
    if (s.length === 3 && s[0] === 'items' && isUuid(s[1]) && s[2] === 'preview-price' && method === 'GET') {
      const id = s[1]
      const raw = String(req.query.modifiers || '')
      const ids = raw
        ? raw
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
        : []
      for (const x of ids) {
        if (!isUuid(x)) return errRes(res, 400, 'modifier id inválido')
      }
      const { data, error } = await supabase.rpc('fn_final_item_price', {
        p_menu_item_id: id,
        p_modifier_ids: ids,
      })
      if (error) return errRes(res, 400, error.message)
      return res.json({ final_price: data })
    }

    // --- items/:id GET PATCH DELETE
    if (s.length === 2 && s[0] === 'items' && isUuid(s[1])) {
      const id = s[1]
      if (method === 'GET') {
        const { data: item, error } = await supabase.from('menu_items').select('*').eq('id', id).maybeSingle()
        if (error) return errRes(res, 500, error.message)
        if (!item) return errRes(res, 404, 'No encontrado')
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
        return res.json({
          item,
          modifier_group_links: links || [],
          recipes: recipes || [],
          recipe_lines,
          price_changes: priceLog || [],
        })
      }
      if (method === 'PATCH') {
        requireManager(profile)
        const body = schemas.menuItemPatch.parse(jsonBody(req))
        const { modifier_group_ids, ...rest } = body
        const { data, error } = await supabase.from('menu_items').update(rest).eq('id', id).select('*').single()
        if (error) return errRes(res, 400, error.message)
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
      }
      if (method === 'DELETE') {
        requireManager(profile)
        if (req.query.hard === '1') {
          const { count, error: cErr } = await supabase
            .from('order_items')
            .select('*', { count: 'exact', head: true })
            .eq('menu_item_id', id)
          if (cErr) return errRes(res, 500, cErr.message)
          if (count && count > 0) {
            return res.status(409).json({
              error: 'no se puede borrar; usar desactivar',
              detail: 'El producto aparece en pedidos.',
            })
          }
          const { error } = await supabase.from('menu_items').delete().eq('id', id)
          if (error) return errRes(res, 400, error.message)
          return res.status(204).end()
        }
        const { data, error } = await supabase.from('menu_items').update({ active: false }).eq('id', id).select('*').single()
        if (error) return errRes(res, 400, error.message)
        return res.json({ soft_deleted: true, item: data })
      }
    }

    // --- items GET POST
    if (s.length === 1 && s[0] === 'items') {
      if (method === 'GET') {
        const page = Math.max(1, parseInt(String(req.query.page || '1'), 10))
        const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)))
        const from = (page - 1) * limit
        const to = from + limit - 1
        let q = supabase.from('menu_items').select('*', { count: 'exact' }).order('sort_order').range(from, to)
        if (req.query.category_id) q = q.eq('category_id', req.query.category_id)
        if (req.query.q) q = q.ilike('name', `%${req.query.q}%`)
        if (req.query.active === 'true') q = q.eq('active', true)
        if (req.query.active === 'false') q = q.eq('active', false)
        const { data, error, count } = await q
        if (error) return errRes(res, 500, error.message)
        return res.json({ items: data || [], page, limit, total: count ?? data?.length ?? 0 })
      }
      if (method === 'POST') {
        requireManager(profile)
        const body = schemas.menuItemCreate.parse(jsonBody(req))
        const { modifier_group_ids, ...rest } = body
        if (!rest.category_id && !rest.category) rest.category = 'food'
        const { data: item, error } = await supabase.from('menu_items').insert(rest).select('*').single()
        if (error) return errRes(res, 400, error.message)
        if (modifier_group_ids?.length) {
          const rows = modifier_group_ids.map((gid, i) => ({
            menu_item_id: item.id,
            modifier_group_id: gid,
            sort_order: i * 10,
          }))
          await supabase.from('menu_item_modifier_groups').insert(rows)
        }
        return res.status(201).json(item)
      }
    }

    // --- modifier-groups/:id
    if (s.length === 2 && s[0] === 'modifier-groups' && isUuid(s[1])) {
      const id = s[1]
      if (method === 'PATCH') {
        requireManager(profile)
        const body = schemas.modifierGroupPatch.parse(jsonBody(req))
        const { data, error } = await supabase.from('modifier_groups').update(body).eq('id', id).select('*').single()
        if (error) return errRes(res, 400, error.message)
        return res.json(data)
      }
      if (method === 'DELETE') {
        requireManager(profile)
        const { error } = await supabase.from('modifier_groups').delete().eq('id', id)
        if (error) return errRes(res, 400, error.message)
        return res.status(204).end()
      }
    }

    // --- modifier-groups
    if (s.length === 1 && s[0] === 'modifier-groups') {
      if (method === 'GET') {
        const { data, error } = await supabase.from('modifier_groups').select('*').order('sort_order')
        if (error) return errRes(res, 500, error.message)
        return res.json({ modifier_groups: data || [] })
      }
      if (method === 'POST') {
        requireManager(profile)
        const body = schemas.modifierGroupCreate.parse(jsonBody(req))
        const { data, error } = await supabase.from('modifier_groups').insert(body).select('*').single()
        if (error) return errRes(res, 400, error.message)
        return res.status(201).json(data)
      }
    }

    // --- modifiers/:id
    if (s.length === 2 && s[0] === 'modifiers' && isUuid(s[1])) {
      const id = s[1]
      if (method === 'PATCH') {
        requireManager(profile)
        const body = schemas.modifierPatch.parse(jsonBody(req))
        if (body.price_extra !== undefined && body.price_extra !== null) {
          const raw = jsonBody(req)
          const reason = raw.price_reason || raw.reason
          if (!reason || String(reason).trim().length < 5) {
            return errRes(res, 400, 'Se requiere reason o price_reason (mín. 5 caracteres) para cambiar precio_extra')
          }
          const { data, error } = await supabase.rpc('modifier_set_price_extra', {
            p_id: id,
            p_price_extra: body.price_extra,
            p_user_id: user.id,
            p_reason: String(reason),
          })
          if (error) return errRes(res, 400, error.message)
          const rest = { ...body }
          delete rest.price_extra
          delete rest.modifier_group_id
          if (Object.keys(rest).length) {
            const { data: updated, error: e2 } = await supabase.from('modifiers').update(rest).eq('id', id).select('*').single()
            if (e2) return errRes(res, 400, e2.message)
            return res.json(updated)
          }
          const row = Array.isArray(data) ? data[0] : data
          return res.json(row)
        }
        const { data, error } = await supabase.from('modifiers').update(body).eq('id', id).select('*').single()
        if (error) return errRes(res, 400, error.message)
        return res.json(data)
      }
      if (method === 'DELETE') {
        requireManager(profile)
        const { error } = await supabase.from('modifiers').delete().eq('id', id)
        if (error) return errRes(res, 400, error.message)
        return res.status(204).end()
      }
    }

    // --- modifiers
    if (s.length === 1 && s[0] === 'modifiers') {
      if (method === 'GET') {
        let q = supabase.from('modifiers').select('*').order('sort_order')
        if (req.query.group_id) q = q.eq('modifier_group_id', req.query.group_id)
        const { data, error } = await q
        if (error) return errRes(res, 500, error.message)
        return res.json({ modifiers: data || [] })
      }
      if (method === 'POST') {
        requireManager(profile)
        const body = schemas.modifierCreate.parse(jsonBody(req))
        const { data, error } = await supabase.from('modifiers').insert(body).select('*').single()
        if (error) return errRes(res, 400, error.message)
        return res.status(201).json(data)
      }
    }
  } catch (e) {
    if (e instanceof ZodError) {
      return res.status(400).json({ error: 'Validación', detail: z.flattenError(e) })
    }
    if (e?.status && typeof e.status === 'number') {
      return res.status(e.status).json({ error: e.error, detail: e.detail, roles: e.roles })
    }
    console.error('[menu/cms]', e)
    return errRes(res, 500, e.message || 'Error')
  }

  return res.status(404).json({ error: `Ruta CMS /api/menu/${s.join('/')} no soportada` })
}

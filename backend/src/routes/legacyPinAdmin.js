/**
 * Rutas legacy para AdminPage (PIN) — mismas URLs que Vercel /api/admin-menu y
 * /api/admin-upload, para que `vite` + proxy + `npm run dev` en backend funcionen
 * sin `vercel dev`.
 */
const express = require('express')
const router = express.Router()
const { supabase } = require('../services/supabase')

const ADMIN_PIN = process.env.ADMIN_MENU_PIN || 'yacunaj2025'

function requirePin (req, res, next) {
  if (req.headers.authorization !== `Bearer ${ADMIN_PIN}`) {
    return res.status(401).json({ error: 'No autorizado' })
  }
  next()
}

router.get('/admin-menu', requirePin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category')
      .order('sort_order')
      .order('name')
    if (error) throw error
    return res.status(200).json(data || [])
  } catch (err) {
    console.error('[admin-menu] GET:', err)
    return res.status(500).json({ error: err.message })
  }
})

router.post('/admin-menu', requirePin, async (req, res) => {
  try {
    const { name, description, price, price_type, category, image_url, active, sort_order } = req.body || {}
    if (!name || !category) {
      return res.status(400).json({ error: 'Missing name or category' })
    }
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        name,
        description: description || null,
        price: price != null ? Number(price) : null,
        price_type: price_type || 'fixed',
        category,
        image_url: image_url || null,
        active: active ?? true,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single()
    if (error) throw error
    return res.status(201).json(data)
  } catch (err) {
    console.error('[admin-menu] POST:', err)
    return res.status(500).json({ error: err.message })
  }
})

router.put('/admin-menu', requirePin, async (req, res) => {
  try {
    const { id, ...updates } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return res.status(200).json(data)
  } catch (err) {
    console.error('[admin-menu] PUT:', err)
    return res.status(500).json({ error: err.message })
  }
})

router.delete('/admin-menu', requirePin, async (req, res) => {
  try {
    const id = req.query.id
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('[admin-menu] DELETE:', err)
    return res.status(500).json({ error: err.message })
  }
})

router.post('/admin-upload', requirePin, async (req, res) => {
  try {
    const { fileName, fileData, contentType } = req.body || {}
    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'Missing fileName or fileData' })
    }
    const buffer = Buffer.from(fileData, 'base64')
    const safeName = String(fileName).replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `items/${Date.now()}-${safeName}`

    const { error } = await supabase.storage
      .from('menu-images')
      .upload(filePath, buffer, {
        contentType: contentType || 'image/jpeg',
        upsert: true,
      })
    if (error) throw error

    const { data: { publicUrl } } = supabase.storage.from('menu-images').getPublicUrl(filePath)
    return res.status(200).json({ url: publicUrl })
  } catch (err) {
    console.error('[admin-upload]:', err)
    return res.status(500).json({ error: err.message })
  }
})

module.exports = router

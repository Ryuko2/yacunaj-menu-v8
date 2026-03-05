import { supabase } from './_supabase.js'

const ADMIN_PIN = 'yacunaj2025'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const adminKey = req.headers['authorization']
  if (adminKey !== `Bearer ${ADMIN_PIN}`) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category')
        .order('sort_order')
        .order('name')
      if (error) throw error
      return res.status(200).json(data)
    }

    if (req.method === 'POST') {
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
          sort_order: sort_order ?? 0
        })
        .select().single()
      if (error) throw error
      return res.status(201).json(data)
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body || {}
      if (!id) return res.status(400).json({ error: 'Missing id' })
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select().single()
      if (error) throw error
      return res.status(200).json(data)
    }

    if (req.method === 'DELETE') {
      const { id } = req.query || {}
      if (!id) return res.status(400).json({ error: 'Missing id' })
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
      if (error) throw error
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[admin-menu] error:', err)
    return res.status(500).json({ error: err.message })
  }
}

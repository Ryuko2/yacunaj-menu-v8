import { supabase } from './_supabase.js'

const ADMIN_PIN = 'yacunaj2025'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const adminKey = req.headers['authorization']
  if (adminKey !== `Bearer ${ADMIN_PIN}`) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { fileName, fileData, contentType } = req.body || {}
    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'Missing fileName or fileData' })
    }

    const buffer = Buffer.from(fileData, 'base64')
    const safeName = (fileName || 'image').replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `items/${Date.now()}-${safeName}`

    const { error } = await supabase.storage
      .from('menu-images')
      .upload(filePath, buffer, {
        contentType: contentType || 'image/jpeg',
        upsert: true
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('menu-images')
      .getPublicUrl(filePath)

    return res.status(200).json({ url: publicUrl })
  } catch (err) {
    console.error('[admin-upload] error:', err)
    return res.status(500).json({ error: err.message })
  }
}

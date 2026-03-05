import { supabase } from '../../_supabase.js'

function getIdFromRequest(req) {
  if (req.query && req.query.id) return req.query.id
  const url = req.url || ''
  const match = url.match(/\/api\/orders\/([^/]+)\/status/)
  return match ? match[1] : null
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const id = getIdFromRequest(req)
    if (!id) return res.status(400).json({ error: 'Missing order id' })

    const body = req.body || {}
    const { status } = body
    if (!status) return res.status(400).json({ error: 'Missing status' })

    const { data, error } = await supabase
      .from('orders').update({ status }).eq('id', id).select().single()

    if (error) throw error
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

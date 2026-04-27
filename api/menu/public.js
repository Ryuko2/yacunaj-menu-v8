import { createRequire } from 'node:module'
import { createClient } from '@supabase/supabase-js'

// El shared/ es CJS para que /backend (CJS) lo consuma sin esfuerzo.
// Desde aqui (ESM) lo cargamos via createRequire — funciona en Node 18+ y en Vercel.
const require = createRequire(import.meta.url)
const { fetchMenuPublic } = require('../../shared/handlers/menuPublic.js')

function getAdminClient () {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export default async function handler (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = getAdminClient()
  const result = await fetchMenuPublic(supabase, { at: new Date() })
  return res.status(result.status).json(result.body)
}

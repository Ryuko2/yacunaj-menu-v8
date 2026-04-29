import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'
import { supabase } from '../../_supabase.js'
import { getStaffUserFromRequest } from '../../_auth.js'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const inv = require(path.join(__dirname, '../../../backend/src/inventory/inventoryService.cjs'))

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json')
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    await getStaffUserFromRequest(req)
    if (req.method === 'GET') {
      const body = await inv.listSuppliers(supabase)
      return res.status(200).json(body)
    }
    if (req.method === 'POST') {
      const row = await inv.createSupplier(supabase, req.body || {})
      return res.status(201).json(row)
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    if (err && typeof err.status === 'number') {
      return res.status(err.status).json({ error: err.error, detail: err.detail })
    }
    const st = err.message === 'Nombre requerido' ? 400 : 500
    console.error('[api/suppliers]', err)
    return res.status(st).json({ error: err.message })
  }
}

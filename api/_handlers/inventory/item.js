import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'
import { supabase } from '../../_supabase.js'
import { getStaffUserFromRequest } from '../../_auth.js'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const inv = require(path.join(__dirname, '../../../backend/src/inventory/inventoryService.cjs'))

function getId(req, ctx) {
  return (
    ctx?.params?.id ||
    req.query?.id ||
    (req.url || '').match(/\/api\/inventory\/([^/]+)$/)?.[1]
  )
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json')
}

export default async function handler(req, res, ctx = {}) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await getStaffUserFromRequest(req)
    const id = getId(req, ctx)
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const row = await inv.updateInventoryItem(supabase, id, req.body || {})
    return res.status(200).json(row)
  } catch (err) {
    if (err && typeof err.status === 'number') {
      return res.status(err.status).json({ error: err.error, detail: err.detail })
    }
    console.error('[api/inventory/[id]]', err)
    return res.status(500).json({ error: err.message })
  }
}

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
    (req.url || '').match(/\/api\/inventory\/([^/]+)\/movement/)?.[1]
  )
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json')
}

export default async function handler(req, res, ctx = {}) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { user } = await getStaffUserFromRequest(req)
    const id = getId(req, ctx)
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const movement = await inv.createMovement(supabase, id, req.body || {}, user?.id)
    return res.status(201).json(movement)
  } catch (err) {
    if (err && typeof err.status === 'number') {
      return res.status(err.status).json({ error: err.error, detail: err.detail })
    }
    console.error('[api/inventory/[id]/movement]', err)
    return res.status(400).json({ error: err.message })
  }
}

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'
import { supabase } from '../../_supabase.js'
import { getStaffUserFromRequest } from '../../_auth.js'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const { getCostsReport } = require(
  path.join(__dirname, '../../../backend/src/reports/reportService.cjs')
)

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Content-Type', 'application/json')
}

export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await getStaffUserFromRequest(req)
    const body = await getCostsReport(supabase, req.query || {})
    return res.status(200).json(body)
  } catch (err) {
    if (err && typeof err.status === 'number') {
      return res.status(err.status).json({ error: err.error, detail: err.detail })
    }
    console.error('[api/reports/costs]', err)
    return res.status(500).json({ error: err.message })
  }
}

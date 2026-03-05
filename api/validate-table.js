import { supabase } from './_supabase.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { table, token } = req.query || {}
  const { data, error } = await supabase
    .from('tables').select('*')
    .eq('table_number', parseInt(table))
    .eq('qr_token', token)
    .eq('active', true).single()

  return res.status(200).json({ data, error })
}

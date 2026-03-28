import { supabase } from './_supabase.js'
import { sendTelegramMessage } from './_telegram.js'

function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 9000) + 1000
  return `YAC-${dateStr}-${random}`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { table_number, qr_token, items, notes, source } = req.body || {}

    console.log('[create-order] incoming:', { table_number, qr_token, itemCount: items?.length, source })

    if (!table_number || !qr_token) {
      return res.status(400).json({ error: 'Missing table_number or qr_token' })
    }

    const FALLBACK_TOKENS = {
      1:'tok_t1_abc123',  2:'tok_t2_bcd234',  3:'tok_t3_cde345',
      4:'tok_t4_def456',  5:'tok_t5_efg567',  6:'tok_t6_fgh678',
      7:'tok_t7_ghi789',  8:'tok_t8_hij890',  9:'tok_t9_ijk901',
      10:'tok_t10_bcd890',
    }

    let tableValid = false

    try {
      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .select('*')
        .eq('table_number', parseInt(table_number))
        .eq('qr_token', qr_token)
        .eq('active', true)
        .single()

      if (!tableError && tableData) {
        tableValid = true
        console.log('[create-order] validated via Supabase ✅')
      } else {
        console.warn('[create-order] Supabase check failed, trying fallback:', tableError?.message)
        tableValid = FALLBACK_TOKENS[parseInt(table_number)] === qr_token
        if (tableValid) console.log('[create-order] validated via fallback ✅')
      }
    } catch (e) {
      console.warn('[create-order] Supabase threw, using fallback:', e.message)
      tableValid = FALLBACK_TOKENS[parseInt(table_number)] === qr_token
    }

    if (!tableValid) {
      console.error('[create-order] INVALID token:', { table_number, qr_token })
      return res.status(403).json({
        error: 'Token inválido',
        detail: `Mesa ${table_number} no reconocida. Escanea el QR de tu mesa.`
      })
    }

    console.log('[create-order] table validated ✅ mesa:', parseInt(table_number))

    const total = items.reduce((sum, item) => {
      return sum + ((item.finalPrice || 0) * (item.quantity || 1))
    }, 0)

    const order_number = generateOrderNumber()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number,
        table_number: parseInt(table_number),
        items,
        total,
        notes: notes || null,
        status: 'pending'
      })
      .select()
      .single()

    if (orderError) {
      console.error('[create-order] supabase insert error:', orderError)
      throw orderError
    }

    console.log('[create-order] order saved ✅', order_number)

    await sendTelegramMessage({ ...order, source }, items)

    return res.status(200).json({
      success: true,
      order_number,
      order_id: order.id
    })

  } catch (err) {
    console.error('[create-order] fatal error:', err)
    return res.status(500).json({
      error: 'Error al crear la orden',
      detail: err.message
    })
  }
}

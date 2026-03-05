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
    const { table_number, qr_token, items, notes } = req.body || {}

    console.log('[create-order] incoming:', { table_number, qr_token, itemCount: items?.length })

    if (!table_number || !qr_token) {
      return res.status(400).json({ error: 'Missing table_number or qr_token' })
    }

    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('table_number', parseInt(table_number))
      .eq('qr_token', qr_token)
      .eq('active', true)
      .single()

    if (tableError || !tableData) {
      console.error('[create-order] token validation failed:', { table_number, qr_token, tableError })
      return res.status(403).json({
        error: 'Token de mesa inválido',
        detail: tableError?.message
      })
    }

    console.log('[create-order] table validated ✅ mesa:', tableData.table_number)

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

    await sendTelegramMessage(order, items)

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

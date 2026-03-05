const { supabase } = require('./_supabase')
const { sendTelegramMessage } = require('./_telegram')

function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 9000) + 1000
  return `YAC-${dateStr}-${random}`
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { table_number, qr_token, items, notes } = req.body
    const { data: tableData, error: tableError } = await supabase
      .from('tables').select('*')
      .eq('table_number', parseInt(table_number))
      .eq('qr_token', qr_token)
      .eq('active', true).single()

    if (tableError || !tableData) {
      console.error('Token validation failed:', { table_number, qr_token, tableError })
      return res.status(403).json({ error: 'Invalid table token', detail: tableError?.message })
    }

    const total = items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0)
    const order_number = generateOrderNumber()

    const { data: order, error } = await supabase
      .from('orders')
      .insert({ order_number, table_number: parseInt(table_number), items, total, notes: notes || null })
      .select().single()

    if (error) throw error
    await sendTelegramMessage(order, items)
    return res.status(200).json({ success: true, order_number, order_id: order.id })
  } catch (err) {
    console.error('Order error:', err)
    return res.status(500).json({ error: 'Failed to create order', detail: err.message })
  }
}

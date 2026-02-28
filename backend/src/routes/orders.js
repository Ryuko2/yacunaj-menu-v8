const express = require('express')
const router = express.Router()
const { supabase } = require('../services/supabase')
const { sendTelegramMessage } = require('../services/telegram')
const { generateOrderNumber } = require('../utils/orderNumber')

// POST /api/order
router.post('/order', async (req, res) => {
  try {
    const { table_number, qr_token, items, notes } = req.body

    // Validate token
    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('table_number', table_number)
      .eq('qr_token', qr_token)
      .eq('active', true)
      .single()

    if (tableError || !tableData) {
      return res.status(403).json({ error: 'Invalid table token' })
    }

    const total = items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0)
    const order_number = generateOrderNumber()

    const { data: order, error } = await supabase
      .from('orders')
      .insert({ order_number, table_number, items, total, notes })
      .select()
      .single()

    if (error) throw error

    // Send Telegram notification
    await sendTelegramMessage(order, items)

    res.json({ success: true, order_number, order_id: order.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// GET /api/orders (admin)
router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// PATCH /api/orders/:id/status
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update order' })
  }
})

module.exports = router

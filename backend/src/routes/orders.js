const express = require('express')
const router = express.Router()
const { supabase } = require('../services/supabase')
const { sendTelegramMessage } = require('../services/telegram')
const { generateOrderNumber } = require('../utils/orderNumber')

/** Paridad con `api/create-order.js` (Vercel) y `src/lib/tableQrTokens.js` */
const FALLBACK_TOKENS = {
  0: 'tok_crm_counter_yacunaj',
  1: 'tok_t1_abc123',
  2: 'tok_t2_bcd234',
  3: 'tok_t3_cde345',
  4: 'tok_t4_def456',
  5: 'tok_t5_efg567',
  6: 'tok_t6_fgh678',
  7: 'tok_t7_ghi789',
  8: 'tok_t8_hij890',
  9: 'tok_t9_ijk901',
  10: 'tok_t10_bcd890',
}

async function validateTableToken(table_number, qr_token) {
  const tn = parseInt(table_number, 10)
  if (Number.isNaN(tn) || qr_token == null || qr_token === '') return false
  try {
    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('table_number', tn)
      .eq('qr_token', qr_token)
      .eq('active', true)
      .single()
    if (!tableError && tableData) return true
    return FALLBACK_TOKENS[tn] === qr_token
  } catch {
    return FALLBACK_TOKENS[tn] === qr_token
  }
}

// POST /api/create-order — mismo contrato que Vercel (`api/create-order.js`); dev con Express.
router.post('/create-order', async (req, res) => {
  try {
    const { table_number, qr_token, items, notes, source = 'qr' } = req.body || {}
    
    // 1. Seguridad básica: Si es CRM o Staff, validar JWT de Supabase
    if (source === 'crm' || source === 'staff') {
      const authHeader = req.headers.authorization || ''
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
      
      if (!token) {
        return res.status(401).json({ error: 'No autorizado', detail: 'Se requiere login de staff para pedidos CRM' })
      }
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        return res.status(401).json({ error: 'Sesión inválida', detail: authError?.message })
      }
      
      // Verificar perfil activo
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, active')
        .eq('id', user.id)
        .single()
        
      if (!profile || !profile.active) {
        return res.status(403).json({ error: 'Acceso denegado', detail: 'Perfil de staff inactivo' })
      }
    }

    if (!table_number || !qr_token) {
      return res.status(400).json({ error: 'Missing table_number or qr_token' })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing or empty items' })
    }

    const valid = await validateTableToken(table_number, qr_token)
    if (!valid) {
      return res.status(403).json({
        error: 'Token inválido',
        detail: `Mesa ${table_number} no reconocida. Escanea el QR de tu mesa.`,
      })
    }

    const tn = parseInt(table_number, 10)
    const total = items.reduce((sum, item) => {
      return sum + ((item.finalPrice || 0) * (item.quantity || 1))
    }, 0)
    const order_number = generateOrderNumber()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number,
        table_number: tn,
        items,
        total,
        notes: notes || null,
        status: 'pending',
        source: source // Persistimos el origen
      })
      .select()
      .single()

    if (orderError) throw orderError

    await sendTelegramMessage({ ...order, source }, items)

    return res.json({ success: true, order_number, order_id: order.id })
  } catch (err) {
    console.error('[create-order]', err)
    return res.status(500).json({ error: 'Error al crear la orden', detail: err.message })
  }
})

// POST /api/order
router.post('/order', async (req, res) => {
  try {
    const { table_number, qr_token, items, notes } = req.body

    // Validate token
    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('table_number', parseInt(table_number))
      .eq('qr_token', qr_token)
      .eq('active', true)
      .single()

    if (tableError || !tableData) {
      console.error('Token validation failed:', { table_number, qr_token, tableError })
      return res.status(403).json({ error: 'Invalid table token', detail: tableError?.message })
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

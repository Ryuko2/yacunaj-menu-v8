import { supabase } from './_supabase.js'
import { sendTelegramRawMessage } from './_telegram.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { type, tableNumber, qrToken, message, estimatedTotal } = req.body || {}

    if (!type || !tableNumber || !qrToken) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('table_number', parseInt(tableNumber))
      .eq('qr_token', qrToken)
      .eq('active', true)
      .single()

    if (tableError || !tableData) {
      return res.status(403).json({ error: 'Token de mesa inválido' })
    }

    const timestamp = new Date().toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Merida'
    })

    let telegramMsg = ''

    if (type === 'bill') {
      telegramMsg = [
        '🧾 *SOLICITUD DE CUENTA*',
        `🪑 Mesa: *${tableNumber}*`,
        `🕐 Hora: ${timestamp}`,
        estimatedTotal != null && estimatedTotal > 0 ? `💰 Total estimado: $${Number(estimatedTotal).toFixed(0)} MXN` : '',
        '',
        '➡️ El cliente está listo para pagar.',
      ].filter(Boolean).join('\n')
    } else if (type === 'request') {
      telegramMsg = [
        '🙋 *PETICIÓN DE MESA*',
        `🪑 Mesa: *${tableNumber}*`,
        `🕐 Hora: ${timestamp}`,
        `📝 Solicitud: *${message || '—'}*`,
        '',
        '➡️ Atender a la brevedad.',
      ].filter(Boolean).join('\n')
    } else {
      return res.status(400).json({ error: 'Invalid type' })
    }

    const { error: dbError } = await supabase
      .from('table_requests')
      .insert({
        table_number: parseInt(tableNumber),
        type,
        message: message || null,
        status: 'pending'
      })

    if (dbError) {
      console.warn('[request] Supabase insert warning:', dbError.message)
    }

    await sendTelegramRawMessage(telegramMsg)

    return res.status(200).json({ success: true, type, tableNumber })

  } catch (err) {
    console.error('[request] error:', err)
    return res.status(500).json({ error: err.message })
  }
}

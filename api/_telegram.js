const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID

function formatItems(items) {
  return items.map(item => {
    let line = `${item.quantity}x *${item.name}*`
    if (item.options && Object.keys(item.options).length) {
      const opts = Object.entries(item.options)
        .map(([,v]) => Array.isArray(v) ? v.join(', ') : v)
        .filter(Boolean)
      if (opts.length) line += `\n   ↳ ${opts.join(' · ')}`
    } else {
      const legacy = [item.size, item.ingredients?.length && item.ingredients.join(', ')].filter(Boolean)
      if (legacy.length) line += `\n   ↳ ${legacy.join(' · ')}`
    }
    const subtotal = (item.finalPrice || 0) * (item.quantity || 1)
    line += item.finalPrice > 0
      ? ` — $${subtotal.toFixed(0)}`
      : ' — Precio variable'
    if (item.notes) line += `\n   📝 ${item.notes}`
    return line
  }).join('\n\n')
}

export async function sendTelegramMessage(order, items) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[Telegram] Missing env vars')
    return
  }

  const time = new Date(order.created_at || new Date()).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Mexico_City'
  })

  const source = order.source === 'staff' ? '🧑‍🍳 *[STAFF]*' : '📱 *[CLIENTE QR]*'

  const message = [
    `🧾 *NUEVO PEDIDO — YACUNAJ*`,
    source,
    ``,
    `🪑 *Mesa:* ${order.table_number}`,
    `📋 *Pedido #:* ${order.order_number}`,
    `🕐 *Hora:* ${time}`,
    ``,
    `━━━━━━━━━━━━━━━━`,
    formatItems(items),
    `━━━━━━━━━━━━━━━━`,
    ``,
    `💰 *TOTAL: $${Number(order.total).toFixed(2)} MXN*`,
    order.notes ? `\n📝 Notas: ${order.notes}` : '',
  ].filter(l => l !== null && l !== undefined).join('\n')

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' })
    })
    const result = await res.json()
    if (!result.ok) console.error('[Telegram] API error:', result)
    else console.log('[Telegram] sent OK ✅')
  } catch (err) {
    console.error('[Telegram] fetch error:', err.message)
    // No relanzar — orden ya guardada en Supabase
  }
}

/** Send raw text (for bill/request notifications, not orders) */
export async function sendTelegramRawMessage(text) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[Telegram] Skipping send — credentials not configured')
    return
  }
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: 'Markdown'
        }),
      }
    )
    const result = await response.json()
    if (!result.ok) {
      console.error('Telegram API error:', JSON.stringify(result))
    } else {
      console.log('Telegram raw sent OK ✅')
    }
  } catch (err) {
    console.error('Telegram fetch failed:', err.message)
  }
}

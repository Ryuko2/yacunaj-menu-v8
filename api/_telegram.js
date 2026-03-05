const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

if (!BOT_TOKEN || !CHAT_ID) {
  console.warn('[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars')
}

function formatItems(items) {
  return items.map(item => {
    const price = item.finalPrice > 0
      ? ` — $${(item.finalPrice * item.quantity).toFixed(0)}`
      : ' — Precio variable'
    let line = `${item.quantity}x *${item.name}*${price}`
    if (item.size) line += ` (${item.size})`
    if (item.ingredients?.length) line += `\n   Ingredientes: ${item.ingredients.join(', ')}`
    if (item.notes) line += `\n   Nota: ${item.notes}`
    return line
  }).join('\n\n')
}

export async function sendTelegramMessage(order, items) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[Telegram] Skipping send — credentials not configured')
    return
  }

  const time = new Date(order.created_at || new Date()).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Merida'
  })

  const totalLine = order.total > 0
    ? `*TOTAL: $${Number(order.total).toFixed(2)} MXN*`
    : `*TOTAL: Consultar precio en mesa*`

  const message = [
    `*NUEVO PEDIDO - YACUNAJ*`,
    ``,
    `Mesa: ${order.table_number}`,
    `Pedido: ${order.order_number}`,
    `Hora: ${time}`,
    ``,
    `--------------------------------`,
    formatItems(items),
    `--------------------------------`,
    ``,
    totalLine,
    order.notes ? `\nNotas: ${order.notes}` : '',
  ].filter(Boolean).join('\n')

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        }),
      }
    )
    const result = await response.json()
    if (!result.ok) {
      console.error('Telegram API error:', JSON.stringify(result))
    } else {
      console.log('Telegram sent OK ✅ message_id:', result.result?.message_id)
    }
  } catch (err) {
    console.error('Telegram fetch failed:', err.message)
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

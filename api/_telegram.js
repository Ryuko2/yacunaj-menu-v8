const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8404664187:AAEGbQRDU0fDLzjFwb1xt8jYg3hhq68PXdo'
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-5229285277'

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

async function sendTelegramMessage(order, items) {
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
        body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' }),
      }
    )
    const result = await response.json()
    if (!result.ok) {
      console.error('Telegram API error:', result)
    } else {
      console.log('Telegram sent OK ✅')
    }
  } catch (err) {
    console.error('Telegram fetch failed:', err.message)
  }
}

module.exports = { sendTelegramMessage }

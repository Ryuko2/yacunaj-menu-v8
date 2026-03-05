const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8404664187:AAEGbQRDU0fDLzjFwb1xt8jYg3hhq68PXdo'
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-5229285277'

function formatItems(items) {
  return items.map(item => {
    let line = `${item.quantity}x *${item.name}*`
    if (item.size) line += ` (${item.size})`
    const price = item.finalPrice ? ` — $${(item.finalPrice * item.quantity).toFixed(0)}` : ' — Precio variable'
    line += price
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
    : `*TOTAL: Consultar con mesero*`

  const message = [
    `*NUEVO PEDIDO - YACUNAJ*`,
    ``,
    `Mesa: ${order.table_number}`,
    `Pedido #: ${order.order_number}`,
    `Hora: ${time}`,
    ``,
    `--------------------------------`,
    formatItems(items),
    `--------------------------------`,
    ``,
    totalLine,
    order.notes ? `\nNotas: ${order.notes}` : ''
  ].filter(line => line !== null && line !== undefined).join('\n')

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    })

    const result = await response.json()

    if (!result.ok) {
      console.error('Telegram API error:', result)
      // No lanzar error — la orden ya se guardó en Supabase, Telegram es secundario
    } else {
      console.log('Telegram sent OK, message_id:', result.result?.message_id)
    }
  } catch (err) {
    console.error('Telegram fetch error:', err.message)
    // No relanzar — no queremos que falle la orden por Telegram
  }
}

module.exports = { sendTelegramMessage }

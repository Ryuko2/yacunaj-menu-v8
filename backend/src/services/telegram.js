const axios = require('axios')

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

if (!BOT_TOKEN || !CHAT_ID) {
  console.warn('[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars')
}

function formatItems(items) {
  return items.map(item => {
    let line = `${item.quantity}x *${item.name}*`
    if (item.size) line += ` (${item.size})`
    line += ` — $${(item.finalPrice * item.quantity).toFixed(0)}`
    if (item.ingredients?.length) line += `\n   🥗 ${item.ingredients.join(', ')}`
    if (item.notes) line += `\n   📝 ${item.notes}`
    return line
  }).join('\n\n')
}

async function sendTelegramMessage(order, items) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[Telegram] Skipping send — credentials not configured')
    return
  }
  const time = new Date(order.created_at || new Date()).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Merida'
  })

  const message = [
    `🧾 *NUEVO PEDIDO – YACUNAJ* 🌴`,
    `_(Amor en Maya)_`,
    ``,
    `🪑 *Mesa:* ${order.table_number}`,
    `📋 *Pedido #:* ${order.order_number}`,
    `🕐 *Hora:* ${time}`,
    ``,
    `━━━━━━━━━━━━━━━━`,
    formatItems(items),
    `━━━━━━━━━━━━━━━━`,
    ``,
    `💰 *TOTAL: $${Number(order.total).toFixed(2)} MXN*`
  ].join('\n')

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }
    )
    console.log('✅ Telegram notification sent')
    return response.data
  } catch (err) {
    console.error('❌ Telegram error:', err.response?.data || err.message)
    // Don't throw — order still succeeds even if Telegram fails
  }
}

module.exports = { sendTelegramMessage }

const axios = require('axios')

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8404664187:AAEGbQRDU0fDLzjFwb1xt8jYg3hhq68PXdo'
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-5229285277'

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
  const time = new Date(order.created_at || new Date()).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Merida'
  })
  const message = [
    `🧾 *NUEVO PEDIDO – YACUNAJ* 🌴`,
    `_(Amor en Maya)_`, ``,
    `🪑 *Mesa:* ${order.table_number}`,
    `📋 *Pedido #:* ${order.order_number}`,
    `🕐 *Hora:* ${time}`, ``,
    `━━━━━━━━━━━━━━━━`,
    formatItems(items),
    `━━━━━━━━━━━━━━━━`, ``,
    `💰 *TOTAL: $${Number(order.total).toFixed(2)} MXN*`
  ].join('\n')
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID, text: message, parse_mode: 'Markdown'
    })
    console.log('✅ Telegram sent')
  } catch (err) {
    console.error('❌ Telegram error:', err.response?.data || err.message)
  }
}

module.exports = { sendTelegramMessage }

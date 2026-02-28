const axios = require('axios')

function formatItems(items) {
  return items.map(item => {
    let line = `${item.quantity}x ${item.name} — $${(item.finalPrice * item.quantity).toFixed(0)}`
    if (item.ingredients?.length) line += `\n   Ingredientes: ${item.ingredients.join(', ')}`
    if (item.toggles?.length) line += `\n   Preferencias: ${item.toggles.join(', ')}`
    if (item.notes) line += `\n   Nota: ${item.notes}`
    if (item.size) line += ` (${item.size})`
    return line
  }).join('\n\n')
}

async function sendTelegramMessage(order, items) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.warn('Telegram not configured, skipping notification')
    return
  }

  const time = new Date(order.created_at).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Merida'
  })

  const message = `
🧾 *NUEVO PEDIDO – YACUNAJ* 🌴
_(Amor en Maya)_

🪑 *Mesa:* ${order.table_number}
📋 *Pedido #:* ${order.order_number}
🕐 *Hora:* ${time}

━━━━━━━━━━━━━━━━━━
${formatItems(items)}
━━━━━━━━━━━━━━━━━━

💰 *TOTAL: $${order.total.toFixed(2)} MXN*
`.trim()

  try {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
    })
  } catch (err) {
    console.error('Telegram error:', err.message)
  }
}

module.exports = { sendTelegramMessage }

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
})

export async function placeOrder(tableNumber, qrToken, items, notes = '') {
  const base = import.meta.env.VITE_API_URL || ''
  const url = base ? `${base}/api/order` : '/api/order'
  console.log('[placeOrder] sending:', { tableNumber, qrToken, itemCount: items.length })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table_number: tableNumber,
      qr_token: qrToken,
      items,
      notes,
    }),
  })

  const data = await res.json()
  console.log('[placeOrder] response:', res.status, data)

  if (!res.ok) {
    throw new Error(data?.error || data?.detail || `HTTP ${res.status}`)
  }

  return data
}

export async function getOrders(status) {
  const params = status ? { status } : {}
  const { data } = await api.get('/api/orders', { params })
  return data
}

export async function updateOrderStatus(orderId, status) {
  const { data } = await api.patch(`/api/orders/${orderId}/status`, { status })
  return data
}

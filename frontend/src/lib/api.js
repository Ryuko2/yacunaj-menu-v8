import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export async function placeOrder(tableNumber, qrToken, items, notes) {
  const { data } = await api.post('/api/order', {
    table_number: tableNumber,
    qr_token: qrToken,
    items,
    notes,
  })
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

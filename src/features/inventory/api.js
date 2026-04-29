import { supabase } from '../../lib/supabase'

async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Inicia sesión')
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

async function parseJson(res) {
  const text = await res.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { raw: text }
  }
  if (!res.ok) {
    const msg = body?.error || body?.detail || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return body
}

export async function fetchInventory(params) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== '') q.set(k, v)
  }
  const res = await fetch(`/api/inventory?${q}`, { headers: await authHeaders() })
  return parseJson(res)
}

export async function fetchInventoryReorder() {
  const res = await fetch('/api/inventory/reorder', { headers: await authHeaders() })
  return parseJson(res)
}

export async function createInventoryItem(body) {
  const res = await fetch('/api/inventory', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  })
  return parseJson(res)
}

export async function updateInventoryItem(id, body) {
  const res = await fetch(`/api/inventory/${id}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  })
  return parseJson(res)
}

export async function createMovement(id, body) {
  const res = await fetch(`/api/inventory/${id}/movement`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  })
  return parseJson(res)
}

export async function fetchSuppliers() {
  const res = await fetch('/api/suppliers', { headers: await authHeaders() })
  return parseJson(res)
}

export async function createSupplier(body) {
  const res = await fetch('/api/suppliers', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  })
  return parseJson(res)
}

export async function updateSupplier(id, body) {
  const res = await fetch(`/api/suppliers/${id}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  })
  return parseJson(res)
}

import { supabase } from '../../lib/supabase'

async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Inicia sesión para ver reportes')
  }
  return { Authorization: `Bearer ${session.access_token}` }
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

/** @param {Record<string, string | undefined>} params */
export async function fetchSalesReport(params) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, v)
  }
  const res = await fetch(`/api/reports/sales?${q}`, { headers: await authHeaders() })
  return parseJson(res)
}

export async function fetchTopItems(params) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, v)
  }
  const res = await fetch(`/api/reports/items/top?${q}`, { headers: await authHeaders() })
  return parseJson(res)
}

export async function fetchCostsReport(params) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, v)
  }
  const res = await fetch(`/api/reports/costs?${q}`, { headers: await authHeaders() })
  return parseJson(res)
}

export async function fetchMarginsItems(params) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, v)
  }
  const res = await fetch(`/api/reports/margins/items?${q}`, { headers: await authHeaders() })
  return parseJson(res)
}

export async function fetchMarginsLow(params) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, v)
  }
  const res = await fetch(`/api/reports/margins/low?${q}`, { headers: await authHeaders() })
  return parseJson(res)
}

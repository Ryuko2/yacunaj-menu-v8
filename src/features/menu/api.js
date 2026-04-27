import { supabase } from '../../lib/supabase'

function apiBase() {
  // En producción (Vercel), no usamos prefijo de dominio para evitar problemas de CORS y localhost
  return ''
}

/**
 * @param {string} path ej. "/items" → GET {base}/api/menu/items
 * @param {{ method?: string, body?: unknown, token?: string }} [opts]
 */
export async function menuAdminFetch(path, opts = {}) {
  const { method = 'GET', body, token, headers: extraHeaders } = opts
  const { data: { session } } = await supabase.auth.getSession()
  const authToken = token || session?.access_token
  const p = path.startsWith('/') ? path : `/${path}`
  const url = `${apiBase()}/api/menu${p}`
  /** @type {RequestInit} */
  const init = {
    method,
    headers: { Accept: 'application/json', ...(extraHeaders || {}) },
  }
  if (authToken) init.headers.Authorization = `Bearer ${authToken}`
  if (body != null) {
    if (body instanceof FormData) {
      init.body = body
    } else {
      init.headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(body)
    }
  }
  const res = await fetch(url, init)
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    const msg = json?.error || json?.detail || `HTTP ${res.status}`
    const err = new Error(msg)
    err.status = res.status
    err.body = json
    throw err
  }
  return json
}

export function menuPublicUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${apiBase()}/api/menu${p}`
}

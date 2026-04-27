const ADMIN_PIN = 'yacunaj2025'
const base = import.meta.env.VITE_API_URL || ''

function getAuthHeaders() {
  const pin = sessionStorage.getItem('admin_pin')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${pin || ADMIN_PIN}`,
  }
}

/** Evita `res.json()` cuando Vite/proxy devuelve HTML o un chunk JS (SyntaxError). */
async function parseJsonResponse(res) {
  const text = await res.text()
  const trimmed = text.trim()
  if (!trimmed) {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return null
  }
  const first = trimmed[0]
  if (first !== '{' && first !== '[') {
    throw new Error(
      `Respuesta no JSON (${res.status}). ¿Tienes el backend en :3001 y Vite con proxy?`,
    )
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('JSON inválido del servidor')
  }
}

export async function getMenuItems() {
  const res = await fetch(`${base}/api/admin-menu`, { headers: getAuthHeaders() })
  const body = await parseJsonResponse(res)
  if (!res.ok) throw new Error(body?.error || 'Failed to fetch')
  if (!Array.isArray(body)) throw new Error('Formato inesperado (se esperaba una lista)')
  return body
}

export async function createMenuItem(item) {
  const res = await fetch(`${base}/api/admin-menu`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(item),
  })
  const body = await parseJsonResponse(res)
  if (!res.ok) throw new Error(body?.error || 'Failed to create')
  return body
}

export async function updateMenuItem(id, updates) {
  const res = await fetch(`${base}/api/admin-menu`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id, ...updates }),
  })
  const body = await parseJsonResponse(res)
  if (!res.ok) throw new Error(body?.error || 'Failed to update')
  return body
}

export async function deleteMenuItem(id) {
  const res = await fetch(`${base}/api/admin-menu?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  const body = await parseJsonResponse(res)
  if (!res.ok) throw new Error(body?.error || 'Failed to delete')
  return body
}

export async function uploadImage(file) {
  const reader = new FileReader()
  const base64 = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  const res = await fetch(`${base}/api/admin-upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      fileName: file.name,
      fileData: base64,
      contentType: file.type || 'image/jpeg',
    }),
  })
  const body = await parseJsonResponse(res)
  if (!res.ok) throw new Error(body?.error || 'Failed to upload')
  const { url } = body
  if (!url) throw new Error('Sin URL en la respuesta')
  return url
}

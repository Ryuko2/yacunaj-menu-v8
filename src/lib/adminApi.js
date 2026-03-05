const ADMIN_PIN = 'yacunaj2025'
const base = import.meta.env.VITE_API_URL || ''

function getAuthHeaders() {
  const pin = sessionStorage.getItem('admin_pin')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${pin || ADMIN_PIN}`,
  }
}

export async function getMenuItems() {
  const res = await fetch(`${base}/api/admin-menu`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch')
  return res.json()
}

export async function createMenuItem(item) {
  const res = await fetch(`${base}/api/admin-menu`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(item),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create')
  return res.json()
}

export async function updateMenuItem(id, updates) {
  const res = await fetch(`${base}/api/admin-menu`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id, ...updates }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update')
  return res.json()
}

export async function deleteMenuItem(id) {
  const res = await fetch(`${base}/api/admin-menu?id=${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete')
  return res.json()
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
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to upload')
  const { url } = await res.json()
  return url
}

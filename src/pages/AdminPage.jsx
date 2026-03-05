import { useState, useEffect } from 'react'
import { useOrders } from '../hooks/useOrders'
import { SalesStats } from '../components/admin/SalesStats'
import { OrderCard } from '../components/admin/OrderCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import * as adminApi from '../lib/adminApi'

const ADMIN_PIN = 'yacunaj2025'
const CATEGORIES = [
  { id: 'comida', name: 'Comida' },
  { id: 'snacks', name: 'Snacks' },
  { id: 'postres', name: 'Postres' },
  { id: 'cafes', name: 'Cafés' },
  { id: 'cappuccinos', name: 'Capuccinos' },
  { id: 'lattes', name: 'Lattes' },
  { id: 'smoothies', name: 'Smoothies' },
  { id: 'sodas', name: 'Sodas Italianas' },
  { id: 'tisanas', name: 'Tisanas' },
  { id: 'frappe', name: 'Frappé' },
  { id: 'otras-bebidas', name: 'Otras Bebidas' },
]

const TABS = [
  { id: null, label: 'Todos' },
  { id: 'pending', label: 'Pendiente' },
  { id: 'preparing', label: 'Preparando' },
  { id: 'completed', label: 'Completado' },
]

const styles = {
  bg: '#0A1A0F',
  card: '#152B1A',
  gold: '#C9A227',
  text: '#F5F0E8',
  muted: 'rgba(245,240,232,0.6)',
  border: 'rgba(201,162,39,0.2)',
}

function exportToCSV(orders) {
  const headers = ['order_number', 'table_number', 'total', 'status', 'created_at']
  const rows = orders.map(o => [o.order_number, o.table_number, o.total, o.status, new Date(o.created_at).toLocaleString('es-MX')])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `yacunaj-orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('admin_pin', pin)
      onLogin()
    } else {
      setError('PIN incorrecto')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: styles.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ maxWidth: 320, width: '100%', background: styles.card, border: `1px solid ${styles.border}`, borderRadius: 8, padding: '2rem' }}>
        <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', color: styles.gold, marginBottom: '0.5rem', letterSpacing: '0.1em' }}>
          YACUNAJ Admin
        </h1>
        <p style={{ fontFamily: '"Jost", sans-serif', fontSize: '0.8rem', color: styles.muted, marginBottom: '1.5rem' }}>
          Ingresa el PIN para continuar
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError('') }}
            placeholder="PIN"
            style={{
              width: '100%', padding: '0.75rem 1rem', borderRadius: 4,
              background: 'rgba(10,26,15,0.5)', border: `1px solid ${styles.border}`,
              color: styles.text, fontFamily: '"Jost", sans-serif', fontSize: '1rem',
              marginBottom: error ? '0.5rem' : '1rem',
            }}
            autoFocus
          />
          {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</p>}
          <button
            type="submit"
            style={{
              width: '100%', padding: '0.75rem',
              background: `linear-gradient(135deg, ${styles.gold}, #D4AF37)`,
              border: 'none', borderRadius: 4, color: '#0A1A0F',
              fontFamily: '"Jost", sans-serif', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}

function MenuItemRow({ item, categories, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...item })
  const [uploading, setUploading] = useState(false)

  const handleSave = async () => {
    try {
      await adminApi.updateMenuItem(item.id, form)
      onUpdate()
      setEditing(false)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await adminApi.uploadImage(file)
      setForm(f => ({ ...f, image_url: url }))
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este item?')) return
    try {
      await adminApi.deleteMenuItem(item.id)
      onUpdate()
    } catch (err) {
      alert(err.message)
    }
  }

  const toggleActive = async () => {
    try {
      await adminApi.updateMenuItem(item.id, { active: !item.active })
      onUpdate()
    } catch (err) {
      alert(err.message)
    }
  }

  if (editing) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(21,43,26,0.8)', border: `1px solid ${styles.border}`, borderRadius: 4, marginBottom: '0.5rem' }}>
        <input
          value={form.name}
          onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Nombre"
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', background: '#0A1A0F', border: `1px solid ${styles.border}`, borderRadius: 4, color: styles.text }}
        />
        <textarea
          value={form.description || ''}
          onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Descripción"
          rows={2}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', background: '#0A1A0F', border: `1px solid ${styles.border}`, borderRadius: 4, color: styles.text, resize: 'none' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="number"
            value={form.price ?? ''}
            onChange={(e) => setForm(f => ({ ...f, price: e.target.value ? Number(e.target.value) : null }))}
            placeholder="Precio"
            style={{ flex: 1, minWidth: 80, padding: '0.5rem', background: '#0A1A0F', border: `1px solid ${styles.border}`, borderRadius: 4, color: styles.text }}
          />
          <select
            value={form.price_type || 'fixed'}
            onChange={(e) => setForm(f => ({ ...f, price_type: e.target.value }))}
            style={{ padding: '0.5rem', background: '#0A1A0F', border: `1px solid ${styles.border}`, borderRadius: 4, color: styles.text }}
          >
            <option value="fixed">Precio fijo</option>
            <option value="variable">Precio variable</option>
          </select>
          <select
            value={form.category}
            onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
            style={{ padding: '0.5rem', background: '#0A1A0F', border: `1px solid ${styles.border}`, borderRadius: 4, color: styles.text }}
          >
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: '0.75rem' }} />
          {uploading && <span style={{ fontSize: '0.75rem', color: styles.muted }}>Subiendo...</span>}
          {form.image_url && (
            <img src={form.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleSave} style={{ padding: '0.5rem 1rem', background: styles.gold, border: 'none', borderRadius: 4, color: '#0A1A0F', cursor: 'pointer' }}>Guardar</button>
          <button onClick={() => setEditing(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: `1px solid ${styles.border}`, borderRadius: 4, color: styles.muted, cursor: 'pointer' }}>Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: item.active ? 'rgba(21,43,26,0.5)' : 'rgba(21,43,26,0.2)', border: `1px solid ${styles.border}`, borderRadius: 4, marginBottom: '0.5rem', opacity: item.active ? 1 : 0.6 }}>
      {item.image_url ? (
        <img src={item.image_url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
      ) : (
        <div style={{ width: 48, height: 48, background: 'rgba(201,162,39,0.1)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: styles.gold, fontSize: '1.5rem' }}>—</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 500, color: styles.text, margin: 0 }}>{item.name}</p>
        <p style={{ fontFamily: '"Jost", sans-serif', fontSize: '0.75rem', color: styles.muted, margin: '2px 0 0' }}>
          {item.price_type === 'variable' ? 'Precio variable' : `$${item.price}`} · {CATEGORIES.find(c => c.id === item.category)?.name || item.category}
        </p>
      </div>
      <button onClick={toggleActive} style={{ padding: '0.35rem 0.6rem', background: item.active ? 'rgba(79,175,111,0.2)' : 'rgba(201,162,39,0.2)', border: 'none', borderRadius: 4, color: item.active ? '#4CAF6F' : styles.gold, fontSize: '0.7rem', cursor: 'pointer' }}>
        {item.active ? 'Activo' : 'Inactivo'}
      </button>
      <button onClick={() => setEditing(true)} style={{ padding: '0.35rem 0.6rem', background: 'transparent', border: `1px solid ${styles.border}`, borderRadius: 4, color: styles.gold, fontSize: '0.7rem', cursor: 'pointer' }}>Editar</button>
      <button onClick={handleDelete} style={{ padding: '0.35rem 0.6rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 4, color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer' }}>Eliminar</button>
    </div>
  )
}

function AddItemForm({ onAdd }) {
  const [form, setForm] = useState({ name: '', description: '', price: null, price_type: 'fixed', category: 'comida', active: true, sort_order: 0 })
  const [uploading, setUploading] = useState(false)

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await adminApi.uploadImage(file)
      setForm(f => ({ ...f, image_url: url }))
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    try {
      await adminApi.createMenuItem(form)
      setForm({ name: '', description: '', price: null, price_type: 'fixed', category: 'comida', active: true, sort_order: 0, image_url: null })
      onAdd()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '1rem', background: 'rgba(28,56,34,0.5)', border: `1px dashed ${styles.border}`, borderRadius: 4, marginBottom: '1rem' }}>
      <p style={{ fontFamily: '"Jost", sans-serif', fontSize: '0.8rem', color: styles.gold, marginBottom: '0.75rem' }}>Agregar nuevo item</p>
      <input
        value={form.name}
        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
        placeholder="Nombre *"
        required
        style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', background: '#0A1A0F', border: `1px solid ${styles.border}`, borderRadius: 4, color: styles.text }}
      />
      <textarea
        value={form.description}
        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder="Descripción"
        rows={2}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', background: '#0A1A0F', border: `1px solid ${styles.border}`, borderRadius: 4, color: styles.text, resize: 'none' }}
      />
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <input
          type="number"
          value={form.price ?? ''}
          onChange={(e) => setForm(f => ({ ...f, price: e.target.value ? Number(e.target.value) : null }))}
          placeholder="Precio"
          style={{ flex: 1, minWidth: 80, padding: '0.5rem', background: '#0A1A0F', border: `1px solid ${styles.border}`, borderRadius: 4, color: styles.text }}
        />
        <select
          value={form.price_type}
          onChange={(e) => setForm(f => ({ ...f, price_type: e.target.value }))}
          style={{ padding: '0.5rem', background: '#0A1A0F', border: `1px solid ${styles.border}`, borderRadius: 4, color: styles.text }}
        >
          <option value="fixed">Precio fijo</option>
          <option value="variable">Precio variable</option>
        </select>
        <select
          value={form.category}
          onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
          style={{ padding: '0.5rem', background: '#0A1A0F', border: `1px solid ${styles.border}`, borderRadius: 4, color: styles.text }}
        >
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: '0.75rem' }} />
        {uploading && <span style={{ fontSize: '0.75rem', color: styles.muted }}>Subiendo...</span>}
        {form.image_url && <img src={form.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />}
      </div>
      <button type="submit" style={{ padding: '0.5rem 1rem', background: `linear-gradient(135deg, ${styles.gold}, #D4AF37)`, border: 'none', borderRadius: 4, color: '#0A1A0F', fontWeight: 600, cursor: 'pointer' }}>
        Agregar
      </button>
    </form>
  )
}

function MenuAdminTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getMenuItems()
      setItems(data)
    } catch (err) {
      console.error(err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const grouped = items.reduce((acc, item) => {
    const cat = item.category || 'comida'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div>
      <AddItemForm onAdd={load} />
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><LoadingSpinner size="lg" /></div>
      ) : items.length === 0 ? (
        <p style={{ color: styles.muted, textAlign: 'center', padding: '2rem' }}>No hay items. Agrega el primero arriba. Si la tabla menu_items no existe en Supabase, ejecuta la migración.</p>
      ) : (
        CATEGORIES.filter(c => grouped[c.id]?.length).map(cat => (
          <div key={cat.id} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: styles.gold, marginBottom: '0.5rem', paddingBottom: '0.25rem', borderBottom: `1px solid ${styles.border}` }}>
              {cat.name}
            </h3>
            {grouped[cat.id].map(item => (
              <MenuItemRow key={item.id} item={item} categories={CATEGORIES} onUpdate={load} onDelete={load} />
            ))}
          </div>
        ))
      )}
    </div>
  )
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState('pedidos')
  const [statusFilter, setStatusFilter] = useState(null)
  const { orders, loading, refetch } = useOrders(statusFilter)

  useEffect(() => {
    if (sessionStorage.getItem('admin_pin') === ADMIN_PIN) {
      setLoggedIn(true)
    }
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('admin_pin')
    setLoggedIn(false)
  }

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />
  }

  return (
    <div style={{ minHeight: '100vh', background: styles.bg, padding: '1rem', maxWidth: 800, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', color: styles.gold, letterSpacing: '0.1em' }}>
          YACUNAJ — Admin
        </h1>
        <button onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: `1px solid ${styles.border}`, borderRadius: 4, color: styles.muted, fontSize: '0.8rem', cursor: 'pointer' }}>
          Cerrar sesión
        </button>
      </header>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('pedidos')}
          style={{
            padding: '0.5rem 1rem', borderRadius: 4, fontSize: '0.85rem',
            background: activeTab === 'pedidos' ? styles.gold : 'transparent',
            border: `1px solid ${activeTab === 'pedidos' ? styles.gold : styles.border}`,
            color: activeTab === 'pedidos' ? '#0A1A0F' : styles.muted,
            cursor: 'pointer',
          }}
        >
          Pedidos
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          style={{
            padding: '0.5rem 1rem', borderRadius: 4, fontSize: '0.85rem',
            background: activeTab === 'menu' ? styles.gold : 'transparent',
            border: `1px solid ${activeTab === 'menu' ? styles.gold : styles.border}`,
            color: activeTab === 'menu' ? '#0A1A0F' : styles.muted,
            cursor: 'pointer',
          }}
        >
          Menú
        </button>
      </div>

      {activeTab === 'pedidos' && (
        <>
          <SalesStats orders={orders} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {TABS.map(tab => (
              <button
                key={tab.id ?? 'all'}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 4, fontSize: '0.8rem',
                  background: statusFilter === tab.id ? styles.gold : 'rgba(21,43,26,0.5)',
                  border: `1px solid ${styles.border}`,
                  color: statusFilter === tab.id ? '#0A1A0F' : styles.muted,
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => exportToCSV(orders)} style={{ padding: '0.5rem 1rem', background: 'rgba(201,162,39,0.15)', border: `1px solid ${styles.border}`, borderRadius: 4, color: styles.gold, fontSize: '0.8rem', cursor: 'pointer' }}>
              Exportar CSV
            </button>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><LoadingSpinner size="lg" /></div>
            ) : orders.length === 0 ? (
              <p style={{ color: styles.muted, textAlign: 'center', padding: '2rem' }}>No hay pedidos</p>
            ) : (
              orders.map(order => <OrderCard key={order.id} order={order} onUpdate={refetch} />)
            )}
          </div>
        </>
      )}

      {activeTab === 'menu' && <MenuAdminTab />}
    </div>
  )
}

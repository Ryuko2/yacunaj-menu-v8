import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { menuCategories as staticCategories } from '../data/menu'

const CATEGORY_META = {
  food: { name: 'Comida', hasSizes: false, hasIngredients: false },
  snacks: { name: 'Snacks', hasSizes: false, hasIngredients: false },
  postres: { name: 'Postres', hasSizes: false, hasIngredients: false },
  cafes: { name: 'Cafés', hasSizes: false, hasIngredients: false },
  cappuccinos: { name: 'Capuccinos', hasSizes: false, hasIngredients: false },
  lattes: { name: 'Lattes', hasSizes: true, sizes: [{ id: 'chico', label: 'Chico', price: 58 }, { id: 'grande', label: 'Grande', price: 68 }], hasIngredients: false },
  smoothies: { name: 'Smoothies', hasSizes: false, hasIngredients: false },
  sodas: { name: 'Sodas Italianas', hasSizes: false, hasIngredients: false },
  tisanas: { name: 'Tisanas', hasSizes: false, hasIngredients: false },
  frappe: { name: 'Frappé', hasSizes: false, hasIngredients: false },
  'otras-bebidas': { name: 'Otras Bebidas', hasSizes: false, hasIngredients: false },
}

function normalizeCatalogPayload(payload) {
  const raw = payload?.categories
  if (!Array.isArray(raw) || raw.length === 0) return null
  const categories = raw
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      hasSizes: !!cat.hasSizes,
      sizes: Array.isArray(cat.sizes) ? cat.sizes : undefined,
      hasIngredients: !!cat.hasIngredients,
      items: Array.isArray(cat.items) ? cat.items : [],
    }))
    .filter((c) => c.items.length > 0)
  return categories.length ? categories : null
}

async function fetchMenuPublicApi() {
  const apiBase = import.meta.env.VITE_API_URL || ''
  const url = apiBase ? `${apiBase.replace(/\/$/, '')}/api/menu/public` : '/api/menu/public'
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const text = await res.text()
  const trimmed = text.trim()
  if (!res.ok) throw new Error(`menu public HTTP ${res.status}`)
  if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) {
    throw new Error('menu public: respuesta no JSON (¿backend en :3001 + proxy Vite?)')
  }
  return JSON.parse(text)
}

async function fetchMenuPublicRpc() {
  const { data, error } = await supabase.rpc('get_menu_public_catalog', {
    p_at: new Date().toISOString(),
  })
  if (error) throw error
  return typeof data === 'string' ? JSON.parse(data) : data
}

export function useMenuItems() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function load() {
      try {
        let payload = null
        try {
          payload = await fetchMenuPublicApi()
        } catch (apiErr) {
          console.warn('[useMenuItems] API pública no disponible, probando RPC:', apiErr.message)
          try {
            payload = await fetchMenuPublicRpc()
          } catch (rpcErr) {
            console.warn('[useMenuItems] RPC catálogo:', rpcErr.message)
          }
        }

        const fromCatalog = normalizeCatalogPayload(payload)
        if (fromCatalog) {
          setCategories(fromCatalog)
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('active', true)
          .order('category')
          .order('sort_order')
          .order('name')

        if (error) {
          console.warn('Supabase menu_items error, using static:', error.message)
          setCategories(staticCategories)
          setLoading(false)
          return
        }

        if (!data || data.length === 0) {
          setCategories(staticCategories)
          setLoading(false)
          return
        }

        const grouped = {}
        data.forEach((item) => {
          const catId = item.category || 'comida'
          if (!grouped[catId]) {
            grouped[catId] = {
              id: catId,
              name: CATEGORY_META[catId]?.name || catId,
              ...CATEGORY_META[catId],
              items: [],
            }
          }
          grouped[catId].items.push({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            price_type: item.price_type || (item.price == null ? 'variable' : 'fixed'),
            category: catId,
            image_url: item.image_url,
            basePrice: item.price,
          })
        })

        setCategories(
          Object.values(grouped).sort((a, b) => {
            const order = Object.keys(CATEGORY_META)
            return (order.indexOf(a.id) >= 0 ? order.indexOf(a.id) : 999) - (order.indexOf(b.id) >= 0 ? order.indexOf(b.id) : 999)
          })
        )
      } catch (err) {
        console.warn('useMenuItems error, using static:', err)
        setCategories(staticCategories)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { categories, loading }
}

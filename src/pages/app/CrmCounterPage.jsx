import { useEffect, useMemo, useState } from 'react'
import { CategoryNav } from '../../components/layout/CategoryNav'
import { MenuSection } from '../../components/menu/MenuSection'
import { MenuCard } from '../../components/menu/MenuCard'
import { ProductModal } from '../../components/menu/ProductModal'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { useMenuItems } from '../../hooks/useMenuItems'
import { menuCategories as staticCategories } from '../../data/menu'
import { TABLE_QR_TOKENS } from '../../lib/tableQrTokens'
import { placeOrder } from '../../lib/api'
import { ShoppingBag, X, MessageSquare, Plus, Minus } from 'lucide-react'

function cartTotal(items) {
  return items.reduce((s, i) => s + (i.finalPrice || 0) * (i.quantity || 1), 0)
}

export default function CrmCounterPage() {
  const { categories: remoteCategories, loading } = useMenuItems()
  const categories = useMemo(
    () => (remoteCategories?.length > 0 ? remoteCategories : staticCategories),
    [remoteCategories]
  )

  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? 'food')
  const [tableNumber, setTableNumber] = useState(0)
  const [cart, setCart] = useState([])
  const [modalProduct, setModalProduct] = useState(null)
  const [modalCategory, setModalCategory] = useState(null)
  const [kitchenNotes, setKitchenNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCartMobile, setShowCartMobile] = useState(false)

  useEffect(() => {
    const first = categories[0]?.id
    if (first && !categories.find((c) => c.id === activeCategory)) {
      setActiveCategory(first)
    }
  }, [categories, activeCategory])

  const openModal = (item, category) => {
    setModalProduct(item)
    setModalCategory(category)
  }

  const addFromModal = (cartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.cartId === cartItem.cartId)
      if (existing) {
        return prev.map((i) =>
          i.cartId === cartItem.cartId ? { ...i, quantity: i.quantity + cartItem.quantity } : i
        )
      }
      return [...prev, cartItem]
    })
  }

  const updateQty = (cartId, quantity) => {
    setCart((prev) =>
      quantity <= 0 ? prev.filter((i) => i.cartId !== cartId) : prev.map((i) => (i.cartId === cartId ? { ...i, quantity } : i))
    )
  }

  const removeLine = (cartId) => setCart((prev) => prev.filter((i) => i.cartId !== cartId))

  const handleSubmit = async () => {
    setError(null)
    setSuccess(null)
    if (cart.length === 0) {
      setError('Agrega al menos un producto.')
      return
    }
    const token = TABLE_QR_TOKENS[tableNumber]
    if (token == null) {
      setError('Mesa o token no válido.')
      return
    }
    setSubmitting(true)
    try {
      const payload = cart.map(({ cartId: _c, ...rest }) => rest)
      const { order_number: orderNumber } = await placeOrder(tableNumber, token, payload, kitchenNotes, 'crm')
      setSuccess(orderNumber)
      setCart([])
      setKitchenNotes('')
      setShowCartMobile(false)
    } catch (e) {
      setError(e?.message || 'No se pudo enviar el pedido.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const total = cartTotal(cart)
  const hasVariable = cart.some((i) => i.finalPrice === 0)

  const CartContent = ({ isMobile = false }) => (
    <div className={`flex flex-col ${isMobile ? 'h-full' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg text-[#C9A227]">Pedido actual</h2>
        {isMobile && (
          <button onClick={() => setShowCartMobile(false)} className="text-[rgba(245,240,232,0.5)]">
            <X size={20} />
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <p className="font-accent text-sm text-[rgba(245,240,232,0.5)] py-8 text-center">Toca un producto en el menú para agregarlo.</p>
      ) : (
        <ul className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar min-h-[100px]">
          {cart.map((item) => (
            <li
              key={item.cartId}
              className="flex gap-2 border-b border-[rgba(201,162,39,0.12)] pb-3 font-accent text-sm text-[#F5F0E8]"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{item.name}</p>
                {item.size && <p className="text-xs text-[rgba(245,240,232,0.5)]">{item.size}</p>}
                {item.notes && <p className="text-xs italic text-[rgba(245,240,232,0.45)] flex items-center gap-1"><MessageSquare size={10} /> {item.notes}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="h-7 w-7 rounded flex items-center justify-center border border-[rgba(201,162,39,0.3)] text-[#C9A227] hover:bg-[rgba(201,162,39,0.1)] transition-colors"
                  onClick={() => updateQty(item.cartId, item.quantity - 1)}
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center font-medium">{item.quantity}</span>
                <button
                  type="button"
                  className="h-7 w-7 rounded flex items-center justify-center border border-[rgba(201,162,39,0.3)] text-[#C9A227] hover:bg-[rgba(201,162,39,0.1)] transition-colors"
                  onClick={() => updateQty(item.cartId, item.quantity + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="w-14 text-right text-[#C9A227] font-medium">
                {item.finalPrice === 0 ? 'Var.' : `$${(item.finalPrice * item.quantity).toFixed(0)}`}
              </div>
              <button type="button" className="text-[rgba(245,240,232,0.35)] hover:text-red-300 transition-colors px-1" onClick={() => removeLine(item.cartId)} aria-label="Quitar">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-4 pt-4 border-t border-[rgba(201,162,39,0.15)]">
        <label className="block font-accent text-xs text-[rgba(245,240,232,0.7)]">
          Notas para cocina
          <textarea
            value={kitchenNotes}
            onChange={(e) => setKitchenNotes(e.target.value)}
            rows={2}
            placeholder="Opcional: sin cebolla, alergias..."
            className="mt-1 w-full rounded border border-[rgba(201,162,39,0.2)] bg-[#0A1A0F] px-2 py-1.5 text-sm text-[#F5F0E8] focus:border-[#C9A227] outline-none"
          />
        </label>

        <div className="flex items-center justify-between font-accent">
          <span className="text-[#F5F0E8]">Total</span>
          <div className="text-right">
            <span className="text-xl font-bold text-[#C9A227]">
              ${total.toFixed(0)}
            </span>
            {hasVariable && total === 0 && <p className="text-[10px] text-[rgba(245,240,232,0.5)]">(precio variable)</p>}
          </div>
        </div>

        <button
          type="button"
          disabled={submitting || cart.length === 0}
          onClick={handleSubmit}
          className="w-full rounded bg-gradient-to-br from-[#C9A227] to-[#D4AF37] py-3 font-accent text-sm font-bold uppercase tracking-widest text-[#0A1A0F] shadow-lg disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {submitting ? 'Enviando…' : 'Enviar Pedido'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="relative pb-20 lg:pb-0">
      <div className="space-y-6">
        <div>
          <p className="font-accent text-xs uppercase tracking-widest text-[rgba(201,162,39,0.75)]">Panel Mostrador</p>
          <h1 className="font-heading text-2xl text-[#C9A227]">Gestión de Pedidos</h1>
          <p className="mt-1 max-w-2xl font-accent text-sm text-[rgba(245,240,232,0.65)]">
            Toma pedidos directamente desde el mostrador. Usa la mesa 0 para ventas directas sin mesa física.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[rgba(201,162,39,0.2)] bg-[rgba(21,43,26,0.45)] p-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block font-accent text-xs uppercase tracking-tighter text-[rgba(245,240,232,0.5)] mb-1">
              Destino del pedido
            </label>
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(Number(e.target.value))}
              className="w-full rounded border border-[rgba(201,162,39,0.25)] bg-[#0A1A0F] px-3 py-2.5 font-accent text-sm text-[#F5F0E8] focus:border-[#C9A227] outline-none"
            >
              <option value={0}>🛒 Mostrador (Venta rápida)</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  🪑 Mesa {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded border border-red-500/40 bg-red-950/30 px-3 py-2 font-accent text-sm text-red-200 animate-in fade-in duration-300">{error}</div>
        )}
        {success && (
          <div className="rounded border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 font-accent text-sm text-emerald-100 animate-in zoom-in-95 duration-300">
            ✅ Pedido <span className="font-bold text-[#C9A227]">{success}</span> enviado correctamente.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="sticky top-0 z-10 bg-[#0A1A0F] py-2">
              <CategoryNav categories={categories} activeCategory={activeCategory} onSelect={setActiveCategory} />
            </div>
            
            <div className="min-h-[500px]">
              {categories
                .filter((cat) => cat.id === activeCategory)
                .map((cat) => (
                  <div key={cat.id} id={`crm-cat-${cat.id}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <MenuSection title={cat.name} categoryId={cat.id}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {cat.items.map((item) => (
                          <MenuCard key={item.id} item={item} category={cat} onClick={openModal} />
                        ))}
                      </div>
                    </MenuSection>
                  </div>
                ))}
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-4 rounded-xl border border-[rgba(201,162,39,0.2)] bg-[rgba(21,43,26,0.5)] p-5 backdrop-blur-sm">
              <CartContent />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {showCartMobile && (
        <>
          <div 
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setShowCartMobile(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[70] max-h-[85vh] rounded-t-2xl border-t border-[rgba(201,162,39,0.3)] bg-[#0D2010] p-6 lg:hidden animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-[rgba(201,162,39,0.2)] rounded-full mx-auto mb-6" />
            <CartContent isMobile />
          </div>
        </>
      )}

      {/* Floating Action Button for Mobile */}
      {cart.length > 0 && !showCartMobile && (
        <button
          onClick={() => setShowCartMobile(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-[#C9A227] px-6 py-4 font-accent text-sm font-bold text-[#0A1A0F] shadow-2xl lg:hidden animate-in bounce-in duration-500"
        >
          <ShoppingBag size={20} />
          <span>Ver Pedido ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
          <span className="ml-1 pl-3 border-l border-[#0A1A0F]/20 font-bold">${total.toFixed(0)}</span>
        </button>
      )}

      {modalProduct && modalCategory && (
        <ProductModal
          item={modalProduct}
          category={modalCategory}
          onClose={() => { setModalProduct(null); setModalCategory(null) }}
          onAddToCart={addFromModal}
        />
      )}
    </div>
  )
}

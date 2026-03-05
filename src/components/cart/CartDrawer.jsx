import { useCartStore } from '../../store/cartStore'
import { CartItem } from './CartItem'
import { OrderSummary } from './OrderSummary'

export function CartDrawer({ isOpen, onClose }) {
  const items = useCartStore(s => s.items)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden flex flex-col bg-coconut rounded-t-3xl shadow-2xl animate-slide-up">
        <div className="p-4 flex justify-between items-center border-b border-sand">
          <h2 className="font-heading text-xl font-semibold text-palm">Tu Pedido</h2>
          <button onClick={onClose} className="text-bark text-2xl hover:text-palm">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="text-bark/80 text-center py-8">Tu carrito está vacío</p>
          ) : (
            items.map((item) => <CartItem key={item.cartId} item={item} />)
          )}
        </div>
        {items.length > 0 && <OrderSummary onClose={onClose} />}
      </div>
    </div>
  )
}

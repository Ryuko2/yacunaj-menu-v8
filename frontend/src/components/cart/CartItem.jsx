import { useCartStore } from '../../store/cartStore'

export function CartItem({ item }) {
  const updateQuantity = useCartStore(s => s.updateQuantity)
  const removeItem = useCartStore(s => s.removeItem)

  return (
    <div className="flex gap-3 py-3 border-b border-sand last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-bark">{item.name}</p>
        {item.size && <p className="text-xs text-bark/70">{item.size}</p>}
        {item.ingredients?.length > 0 && (
          <p className="text-xs text-bark/70">Ing: {item.ingredients.join(', ')}</p>
        )}
        {item.toggles?.length > 0 && (
          <p className="text-xs text-bark/70">{item.toggles.join(', ')}</p>
        )}
        {item.notes && <p className="text-xs text-bark/70 italic">{item.notes}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
          className="w-8 h-8 rounded-lg bg-sand text-bark font-bold"
        >
          −
        </button>
        <span className="font-accent w-6 text-center">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
          className="w-8 h-8 rounded-lg bg-sand text-bark font-bold"
        >
          +
        </button>
      </div>
      <div className="font-accent font-bold text-palm w-16 text-right">
        ${(item.finalPrice * item.quantity).toFixed(0)}
      </div>
      <button
        onClick={() => removeItem(item.cartId)}
        className="text-red-500 hover:text-red-700 p-1"
        aria-label="Eliminar"
      >
        ✕
      </button>
    </div>
  )
}

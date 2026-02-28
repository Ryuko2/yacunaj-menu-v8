import { useCartStore } from '../../store/cartStore'

export function CartButton({ onClick }) {
  const count = useCartStore(s => s.getCount())
  const total = useCartStore(s => s.getTotal())

  if (count === 0) return null

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-4 rounded-2xl bg-palm text-coconut shadow-xl hover:bg-palm-light transition-all font-accent font-bold"
    >
      <span>🛒</span>
      <span>{count} {count === 1 ? 'item' : 'items'} — ${total.toFixed(0)}</span>
    </button>
  )
}

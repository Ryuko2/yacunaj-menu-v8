import { useCartStore } from '../../store/cartStore'

const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function CartButton({ onClick }) {
  const count = useCartStore(s => s.getCount())
  const total = useCartStore(s => s.getTotal())

  if (count === 0) return null

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.75rem 1.25rem',
        borderRadius: '4px',
        background: 'linear-gradient(135deg, #C9A227, #D4AF37)',
        border: 'none',
        color: '#0A1A0F',
        fontFamily: '"Jost", sans-serif',
        fontWeight: 600,
        fontSize: '0.85rem',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <CartIcon />
      <span>{count} {count === 1 ? 'item' : 'items'} — ${total.toFixed(0)}</span>
    </button>
  )
}

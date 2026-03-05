import { useCartStore } from '../../store/cartStore'
import { CartItem } from './CartItem'
import { OrderSummary } from './OrderSummary'

export function CartDrawer({ isOpen, onClose }) {
  const items = useCartStore(s => s.items)

  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(5,16,8,0.85)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: 'min(380px, 100vw)',
          background: 'linear-gradient(180deg, #0D2010 0%, #0A1A0F 100%)',
          borderLeft: '1px solid rgba(201,162,39,0.2)',
          zIndex: 51,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slide-up 0.3s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(201,162,39,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1.4rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: '#F5F0E8',
            textTransform: 'uppercase',
          }}>
            Tu Pedido
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'rgba(245,240,232,0.7)',
              fontSize: '1.5rem', cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {items.length === 0 ? (
            <p style={{ color: 'rgba(245,240,232,0.5)', textAlign: 'center', padding: '2rem', fontFamily: '"Jost", sans-serif' }}>
              Tu carrito está vacío
            </p>
          ) : (
            items.map((item) => <CartItem key={item.cartId} item={item} />)
          )}
        </div>
        {items.length > 0 && <OrderSummary onClose={onClose} />}
      </div>
    </div>
  )
}

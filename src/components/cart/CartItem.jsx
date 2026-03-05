import { useCartStore } from '../../store/cartStore'

export function CartItem({ item }) {
  const updateQuantity = useCartStore(s => s.updateQuantity)
  const removeItem = useCartStore(s => s.removeItem)
  const isVariable = item.finalPrice === 0

  return (
    <div style={{
      display: 'flex', gap: '0.75rem', padding: '0.75rem 0',
      borderBottom: '1px solid rgba(201,162,39,0.12)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontWeight: 500, color: '#F5F0E8', margin: 0, fontSize: '0.95rem',
        }}>
          {item.name}
        </p>
        {item.size && (
          <p style={{ fontFamily: '"Jost", sans-serif', fontSize: '0.7rem', color: 'rgba(245,240,232,0.5)', margin: '2px 0 0' }}>
            {item.size}
          </p>
        )}
        {item.ingredients?.length > 0 && (
          <p style={{ fontFamily: '"Jost", sans-serif', fontSize: '0.7rem', color: 'rgba(245,240,232,0.5)', margin: '2px 0 0' }}>
            Ing: {item.ingredients.join(', ')}
          </p>
        )}
        {item.notes && (
          <p style={{ fontFamily: '"Jost", sans-serif', fontSize: '0.7rem', color: 'rgba(245,240,232,0.5)', margin: '2px 0 0', fontStyle: 'italic' }}>
            {item.notes}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
          style={{
            width: '28px', height: '28px', borderRadius: '3px',
            background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.25)',
            color: '#C9A227', fontSize: '1rem', cursor: 'pointer',
          }}
        >
          −
        </button>
        <span style={{ fontFamily: '"Jost", sans-serif', width: '1.5rem', textAlign: 'center', color: '#F5F0E8', fontSize: '0.9rem' }}>
          {item.quantity}
        </span>
        <button
          onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
          style={{
            width: '28px', height: '28px', borderRadius: '3px',
            background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.25)',
            color: '#C9A227', fontSize: '1rem', cursor: 'pointer',
          }}
        >
          +
        </button>
      </div>
      <div style={{
        fontFamily: '"Jost", sans-serif', fontWeight: 500, width: '4rem', textAlign: 'right',
        color: isVariable ? 'rgba(201,162,39,0.8)' : '#C9A227',
        fontSize: isVariable ? '0.65rem' : '0.9rem',
      }}>
        {isVariable ? 'Var.' : `$${(item.finalPrice * item.quantity).toFixed(0)}`}
      </div>
      <button
        onClick={() => removeItem(item.cartId)}
        style={{
          background: 'none', border: 'none', color: 'rgba(245,240,232,0.4)',
          cursor: 'pointer', padding: '0.25rem', fontSize: '1rem',
        }}
        aria-label="Eliminar"
      >
        ✕
      </button>
    </div>
  )
}

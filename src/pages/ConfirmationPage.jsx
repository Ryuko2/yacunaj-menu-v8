import { Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

const CheckIcon = () => (
  <svg viewBox="0 0 60 60" fill="none" style={{ width: 60, height: 60 }}>
    <circle cx="30" cy="30" r="28" stroke="#C9A227" strokeWidth="1.5" opacity="0.5" />
    <circle cx="30" cy="30" r="22" stroke="#C9A227" strokeWidth="1" />
    <path d="M18 30l8 9 16-18" stroke="#C9A227" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function ConfirmationPage() {
  const tableNumber = useCartStore(s => s.tableNumber)
  const lastOrderNumber = useCartStore(s => s.lastOrderNumber)

  return (
    <div
      className="page-enter"
      style={{
        minHeight: '100vh', background: '#0A1A0F',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem', maxWidth: '430px', margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <CheckIcon />
        </div>
        <h1 style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '1.75rem', fontWeight: 600, color: '#F5F0E8',
          marginBottom: '0.5rem',
        }}>
          ¡Tu pedido está en camino!
        </h1>
        <p style={{
          fontFamily: '"Jost", sans-serif',
          fontSize: '1.1rem', color: '#C9A227', marginBottom: '1rem',
        }}>
          Pedido #{lastOrderNumber || '---'}
        </p>
        {tableNumber && (
          <p style={{ fontFamily: '"Jost", sans-serif', color: 'rgba(245,240,232,0.7)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            Mesa {tableNumber}
          </p>
        )}
        <p style={{
          fontFamily: '"Jost", sans-serif',
          color: 'rgba(245,240,232,0.6)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.5,
        }}>
          Tu orden ha sido recibida.<br />
          El equipo de Yacunaj la preparará pronto.
        </p>
        <Link
          to="/order"
          style={{
            display: 'inline-block', padding: '0.75rem 1.5rem', borderRadius: '4px',
            background: 'linear-gradient(135deg, #C9A227, #D4AF37)',
            color: '#0A1A0F', fontFamily: '"Jost", sans-serif',
            fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          Ver menú nuevamente
        </Link>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useCartStore } from '../../store/cartStore'
import { placeOrder } from '../../lib/api'
import { LoadingSpinner } from '../ui/LoadingSpinner'

const CheckIcon = () => (
  <svg viewBox="0 0 60 60" fill="none" style={{ width: 56, height: 56 }}>
    <circle cx="30" cy="30" r="28" stroke="#C9A227" strokeWidth="1.5" opacity="0.5" />
    <circle cx="30" cy="30" r="22" stroke="#C9A227" strokeWidth="1" />
    <path d="M18 30l8 9 16-18" stroke="#C9A227" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function SuccessPopup({ orderNumber, tableNumber, onDismiss }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(5, 16, 8, 0.92)',
      backdropFilter: 'blur(8px)',
      padding: '1.5rem',
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{
        background: 'linear-gradient(180deg, #0D2010 0%, #0A1A0F 100%)',
        border: '1px solid rgba(201,162,39,0.3)',
        borderRadius: '8px',
        padding: '2.5rem 2rem',
        maxWidth: '340px',
        width: '100%',
        textAlign: 'center',
        animation: 'slideUp 0.35s ease-out',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '10px', marginBottom: '1.5rem',
        }}>
          <div style={{ height: '1px', width: '40px', background: 'linear-gradient(to right, transparent, #C9A227)' }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A227' }} />
          <div style={{ height: '1px', width: '40px', background: 'linear-gradient(to left, transparent, #C9A227)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <CheckIcon />
        </div>

        <h2 style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '1.8rem', fontWeight: 600, color: '#F5F0E8',
          margin: '0 0 0.5rem', letterSpacing: '0.02em',
        }}>
          Pedido enviado
        </h2>

        <p style={{
          fontFamily: '"Jost", sans-serif',
          fontSize: '0.85rem', fontWeight: 300,
          color: 'rgba(245,240,232,0.6)',
          margin: '0 0 1.5rem', lineHeight: 1.5,
        }}>
          Tu orden está siendo preparada
        </p>

        <div style={{
          background: 'rgba(201,162,39,0.08)',
          border: '1px solid rgba(201,162,39,0.2)',
          borderRadius: '4px',
          padding: '0.75rem 1rem',
          marginBottom: '0.75rem',
        }}>
          <p style={{
            fontFamily: '"Jost", sans-serif',
            fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'rgba(245,240,232,0.5)',
            margin: '0 0 2px',
          }}>Número de pedido</p>
          <p style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1.4rem', fontWeight: 600, color: '#C9A227',
            margin: 0, letterSpacing: '0.05em',
          }}>
            {orderNumber}
          </p>
        </div>

        <p style={{
          fontFamily: '"Jost", sans-serif',
          fontSize: '0.78rem', color: 'rgba(245,240,232,0.5)',
          margin: '0 0 2rem', letterSpacing: '0.05em',
        }}>
          Mesa {tableNumber}
        </p>

        <button
          onClick={onDismiss}
          style={{
            width: '100%', padding: '0.9rem',
            background: 'linear-gradient(135deg, #C9A227, #D4AF37)',
            border: 'none', borderRadius: '3px',
            color: '#0A1A0F', fontFamily: '"Jost", sans-serif',
            fontSize: '0.8rem', fontWeight: 600,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Ver menú
        </button>
      </div>
    </div>
  )
}

export function OrderSummary({ onClose }) {
  const items = useCartStore(s => s.items)
  const tableNumber = useCartStore(s => s.tableNumber)
  const qrToken = useCartStore(s => s.qrToken)
  const getTotal = useCartStore(s => s.getTotal)
  const clearCart = useCartStore(s => s.clearCart)
  const setLastOrderNumber = useCartStore(s => s.setLastOrderNumber)

  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successData, setSuccessData] = useState(null)

  const total = getTotal()
  const hasVariableItems = items.some(i => i.finalPrice === 0)

  const handlePlaceOrder = async () => {
    if (!tableNumber || !qrToken) {
      setError('No se pudo validar la mesa. Escanea el QR nuevamente.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payload = items.map(({ cartId, ...rest }) => rest)
      const { order_number } = await placeOrder(tableNumber, qrToken, payload, notes)
      setLastOrderNumber(order_number)
      clearCart()
      setSuccessData({ orderNumber: order_number, tableNumber })
    } catch (err) {
      console.error('Order error:', err)
      setError(
        err?.response?.data?.error ||
        err?.message ||
        'Error al enviar el pedido. Intenta de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setSuccessData(null)
    onClose()
  }

  return (
    <>
      {successData && (
        <SuccessPopup
          orderNumber={successData.orderNumber}
          tableNumber={successData.tableNumber}
          onDismiss={handleDismiss}
        />
      )}

      <div style={{
        padding: '1.25rem 1.5rem',
        borderTop: '1px solid rgba(201,162,39,0.15)',
        background: 'rgba(21,43,26,0.5)',
      }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', fontFamily: '"Jost", sans-serif', fontSize: '0.75rem', color: 'rgba(245,240,232,0.7)', marginBottom: '0.25rem' }}>
            Notas para la cocina
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional: sin cebolla, extra salsa..."
            style={{
              width: '100%', padding: '0.5rem 0.75rem', borderRadius: '4px',
              background: 'rgba(10,26,15,0.5)', border: '1px solid rgba(201,162,39,0.2)',
              color: '#F5F0E8', resize: 'none', fontFamily: '"Jost", sans-serif', fontSize: '0.85rem', minHeight: '2.5rem',
            }}
          />
        </div>

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: '4px',
            padding: '8px 12px',
            marginBottom: '8px',
          }}>
            <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: 0, fontFamily: '"Jost", sans-serif' }}>
              {error}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, fontSize: '1.1rem', color: '#F5F0E8' }}>
            Total
          </span>
          <span style={{ fontFamily: '"Jost", sans-serif', fontWeight: 600, fontSize: '1.2rem', color: '#C9A227' }}>
            ${total.toFixed(0)}
            {hasVariableItems && total === 0 && (
              <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'rgba(245,240,232,0.6)', marginLeft: '4px' }}>
                (variable)
              </span>
            )}
          </span>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          style={{
            width: '100%', padding: '1rem',
            background: 'linear-gradient(135deg, #C9A227, #D4AF37)',
            border: 'none', borderRadius: '4px',
            color: '#0A1A0F', fontFamily: '"Jost", sans-serif',
            fontSize: '0.85rem', fontWeight: 600,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}
        >
          {loading ? <><LoadingSpinner size="sm" /> Enviando...</> : 'Confirmar Pedido'}
        </button>
      </div>
    </>
  )
}

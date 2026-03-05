import { useState } from 'react'
import { useCartStore } from '../../store/cartStore'
import { placeOrder } from '../../lib/api'
import { useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '../ui/LoadingSpinner'

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

  const navigate = useNavigate()
  const total = getTotal()
  const hasVariableItems = items.some(i => i.finalPrice === 0)

  const handlePlaceOrder = async () => {
    if (!tableNumber || !qrToken) {
      setError('No se pudo validar la mesa')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payload = items.map(({ cartId, ...rest }) => rest)
      const { order_number } = await placeOrder(tableNumber, qrToken, payload, notes)
      setLastOrderNumber(order_number)
      clearCart()
      onClose()
      navigate('/confirmation')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
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
          placeholder="Opcional"
          style={{
            width: '100%', padding: '0.5rem 0.75rem', borderRadius: '4px',
            background: 'rgba(10,26,15,0.5)', border: '1px solid rgba(201,162,39,0.2)',
            color: '#F5F0E8', resize: 'none', fontFamily: '"Jost", sans-serif', fontSize: '0.85rem', minHeight: '2.5rem',
          }}
        />
      </div>
      {error && <p style={{ color: '#E8845A', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{error}</p>}
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
  )
}

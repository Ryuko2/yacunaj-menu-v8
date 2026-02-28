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
    <div className="p-4 border-t border-sand bg-sand/30 rounded-b-2xl">
      <div className="mb-3">
        <label className="text-sm text-bark block mb-1">Notas para la cocina</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional"
          className="w-full p-2 rounded-xl border border-sand bg-white text-sm resize-none h-14"
        />
      </div>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div className="flex justify-between items-center mb-3">
        <span className="font-accent font-bold text-palm text-lg">Total</span>
        <span className="font-accent font-bold text-palm text-xl">${total.toFixed(0)}</span>
      </div>
      <button
        onClick={handlePlaceOrder}
        disabled={loading}
        className="w-full py-3 rounded-2xl bg-palm text-coconut font-accent font-bold hover:bg-palm-light transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <><LoadingSpinner size="sm" /> Enviando...</> : 'Confirmar Pedido'}
      </button>
    </div>
  )
}

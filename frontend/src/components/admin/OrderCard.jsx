import { updateOrderStatus } from '../../lib/api'
import { Badge } from '../ui/Badge'

const STATUS_LABELS = {
  pending: 'Pendiente',
  preparing: 'En preparación',
  completed: 'Completado',
}

const STATUS_VARIANTS = {
  pending: 'pending',
  preparing: 'preparing',
  completed: 'completed',
}

export function OrderCard({ order, onUpdate }) {
  const handleStatusChange = async (newStatus) => {
    try {
      await updateOrderStatus(order.id, newStatus)
      onUpdate?.()
    } catch (err) {
      console.error(err)
    }
  }

  const time = new Date(order.created_at).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-sand/50">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-accent font-bold text-palm">{order.order_number}</p>
          <p className="text-sm text-bark">Mesa {order.table_number} · {time}</p>
        </div>
        <Badge variant={STATUS_VARIANTS[order.status]}>{STATUS_LABELS[order.status]}</Badge>
      </div>
      <ul className="text-sm text-bark space-y-1 mb-3">
        {order.items.map((it, i) => (
          <li key={i}>
            {it.quantity}x {it.name}
            {it.size && ` (${it.size})`}
            {it.ingredients?.length > 0 && ` — ${it.ingredients.join(', ')}`}
          </li>
        ))}
      </ul>
      <p className="font-accent font-bold text-palm mb-3">${Number(order.total).toFixed(0)}</p>
      <div className="flex gap-2">
        {order.status === 'pending' && (
          <button
            onClick={() => handleStatusChange('preparing')}
            className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-800 text-sm font-medium"
          >
            En preparación
          </button>
        )}
        {order.status === 'preparing' && (
          <button
            onClick={() => handleStatusChange('completed')}
            className="px-3 py-1.5 rounded-xl bg-green-100 text-green-800 text-sm font-medium"
          >
            Completado
          </button>
        )}
      </div>
    </div>
  )
}

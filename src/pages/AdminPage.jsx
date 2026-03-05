import { useState } from 'react'
import { useOrders } from '../hooks/useOrders'
import { SalesStats } from '../components/admin/SalesStats'
import { OrderCard } from '../components/admin/OrderCard'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

const TABS = [
  { id: null, label: 'Todos' },
  { id: 'pending', label: 'Pendiente' },
  { id: 'preparing', label: 'Preparando' },
  { id: 'completed', label: 'Completado' },
]

function exportToCSV(orders) {
  const headers = ['order_number', 'table_number', 'total', 'status', 'created_at']
  const rows = orders.map(o => [
    o.order_number,
    o.table_number,
    o.total,
    o.status,
    new Date(o.created_at).toLocaleString('es-MX'),
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `yacunaj-orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminPage() {
  const [statusFilter, setStatusFilter] = useState(null)
  const { orders, loading, refetch } = useOrders(statusFilter)

  return (
    <div className="min-h-screen bg-coconut p-4 max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-palm">
          YACUNAJ — Panel de Administración
        </h1>
      </header>

      <SalesStats orders={orders} />

      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id ?? 'all'}
            onClick={() => setStatusFilter(tab.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
              statusFilter === tab.id
                ? 'bg-palm text-coconut'
                : 'bg-sand text-bark hover:bg-sunset-light/30'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => exportToCSV(orders)}
          className="px-4 py-2 rounded-xl bg-palm/10 text-palm text-sm font-medium"
        >
          Exportar CSV
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-center text-bark/80 py-12">No hay pedidos</p>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} onUpdate={refetch} />
          ))
        )}
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useOrders } from '../../hooks/useOrders'
import { SalesStats } from '../../components/admin/SalesStats'
import { OrderCard } from '../../components/admin/OrderCard'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { exportOrdersToCSV } from '../../lib/exportCsv'

const STATUS_TABS = [
  { id: null, label: 'Todos' },
  { id: 'pending', label: 'Pendiente' },
  { id: 'preparing', label: 'Preparando' },
  { id: 'completed', label: 'Completado' },
]

const SOURCE_TABS = [
  { id: null, label: 'Todos los orígenes' },
  { id: 'qr', label: 'QR' },
  { id: 'crm', label: 'CRM' },
  { id: 'staff', label: 'Staff' },
  { id: 'admin', label: 'Admin' },
]

export default function OrdersAdminPage() {
  const [statusFilter, setStatusFilter] = useState(null)
  const [sourceFilter, setSourceFilter] = useState(null)
  const { orders, loading, refetch } = useOrders(null)

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false
      const src = o.source ?? 'qr'
      if (sourceFilter && src !== sourceFilter) return false
      return true
    })
  }, [orders, statusFilter, sourceFilter])

  return (
    <div>
      <h1 className="mb-4 font-heading text-2xl text-[#C9A227]">Pedidos</h1>
      <SalesStats orders={orders} />

      <div className="mt-4 flex flex-wrap gap-2 overflow-x-auto pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id ?? 'all'}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 font-accent text-xs ${
              statusFilter === tab.id
                ? 'border-[#C9A227] bg-[#C9A227] text-[#0A1A0F]'
                : 'border-[rgba(201,162,39,0.25)] text-[rgba(245,240,232,0.8)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2 overflow-x-auto pb-2">
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab.id ?? 'all-src'}
            type="button"
            onClick={() => setSourceFilter(tab.id)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 font-accent text-xs ${
              sourceFilter === tab.id
                ? 'border-[#C9A227] bg-[rgba(201,162,39,0.2)] text-[#C9A227]'
                : 'border-[rgba(201,162,39,0.25)] text-[rgba(245,240,232,0.7)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => exportOrdersToCSV(filtered)}
          className="rounded-lg border border-[rgba(201,162,39,0.35)] bg-[rgba(201,162,39,0.12)] px-4 py-2 font-accent text-sm text-[#C9A227]"
        >
          Exportar CSV
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center font-accent text-sm text-[rgba(245,240,232,0.55)]">No hay pedidos</p>
        ) : (
          filtered.map((order) => <OrderCard key={order.id} order={order} onUpdate={refetch} />)
        )}
      </div>
    </div>
  )
}

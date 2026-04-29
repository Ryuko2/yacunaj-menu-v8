import { Link } from 'react-router-dom'
import { Store, Receipt, Package, BarChart3, Warehouse, LineChart } from 'lucide-react'
import { SalesStats } from '../../components/admin/SalesStats'
import { useOrders } from '../../hooks/useOrders'
import { useStaffProfile } from '../../hooks/useStaffProfile'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const cards = [
  { to: '/app/counter', label: 'Mostrador', desc: 'Pedidos y menú en mostrador', Icon: Store },
  { to: '/app/orders', label: 'Pedidos', desc: 'Filtros, tiempo real y CSV', Icon: Receipt },
  { to: '/app/menu/items', label: 'Productos', desc: 'CMS de artículos', Icon: Package },
  { to: '/app/reports/sales', label: 'Ventas', desc: 'KPIs y series', Icon: BarChart3 },
  { to: '/app/reports/inventory', label: 'Inventario', desc: 'Surtido y existencias', Icon: Warehouse },
  { to: '/app/reports/costs', label: 'Costos', desc: 'Margen y COGS', Icon: LineChart },
]

export default function OpsHomePage() {
  const { orders, loading } = useOrders(null)
  const { profile, loading: profLoading } = useStaffProfile()

  if (loading || profLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const showPhaseNotice = profile?.role !== 'owner'

  return (
    <div>
      <h1 className="mb-4 font-heading text-2xl text-[#C9A227] md:text-3xl">Panel operativo</h1>

      <div className="mb-8">
        <p className="mb-3 font-accent text-sm text-[rgba(245,240,232,0.55)]">Hoy</p>
        <SalesStats orders={orders} />
      </div>

      {showPhaseNotice && (
        <div className="mb-8 rounded-xl border border-[rgba(201,162,39,0.2)] bg-[rgba(201,162,39,0.06)] p-4 font-accent text-sm text-[rgba(245,240,232,0.75)]">
          Fase en curso: autenticación, CMS de menú, mostrador y reportes. Si necesitas permisos adicionales,
          pide rol <span className="text-[#C9A227]">owner</span> o <span className="text-[#C9A227]">manager</span> en Supabase (tabla{' '}
          <code className="text-[#C9A227]">profiles</code>).
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const CardIcon = card.Icon
          return (
            <Link
              key={card.to}
              to={card.to}
              className="group flex flex-col rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[rgba(21,43,26,0.65)] p-5 transition-colors hover:border-[#C9A227]"
            >
              <CardIcon className="mb-3 h-10 w-10 text-[#C9A227] transition-transform group-hover:scale-105" strokeWidth={1.5} />
              <span className="font-heading text-lg text-[#F5F0E8] group-hover:text-[#C9A227]">{card.label}</span>
              <span className="mt-1 font-accent text-sm text-[rgba(245,240,232,0.55)]">{card.desc}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

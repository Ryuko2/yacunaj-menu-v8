import { Link } from 'react-router-dom'
import { BarChart3, Warehouse, LineChart, Truck } from 'lucide-react'

const cards = [
  {
    to: '/app/reports/sales',
    label: 'Ventas',
    desc: 'KPIs, series y export',
    Icon: BarChart3,
  },
  {
    to: '/app/reports/inventory',
    label: 'Inventario',
    desc: 'Existencias y movimientos',
    Icon: Warehouse,
  },
  {
    to: '/app/reports/inventory/suppliers',
    label: 'Proveedores',
    desc: 'Catálogo de proveedores',
    Icon: Truck,
  },
  {
    to: '/app/reports/costs',
    label: 'Costos y márgenes',
    desc: 'COGS y alertas de margen',
    Icon: LineChart,
  },
]

export default function ReportsHubPage() {
  return (
    <div>
      <h1 className="mb-2 font-heading text-2xl text-[#C9A227] md:text-3xl">Reportes</h1>
      <p className="mb-6 max-w-2xl font-accent text-sm text-[rgba(245,240,232,0.65)]">
        Analítica operativa; las mismas APIs que usa el panel requieren sesión staff.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ to, label, desc, Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[rgba(21,43,26,0.65)] p-5 transition-colors hover:border-[#C9A227]"
          >
            <Icon className="mb-3 h-9 w-9 text-[#C9A227]" strokeWidth={1.5} />
            <span className="font-heading text-lg text-[#F5F0E8] group-hover:text-[#C9A227]">{label}</span>
            <span className="mt-1 font-accent text-sm text-[rgba(245,240,232,0.55)]">{desc}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

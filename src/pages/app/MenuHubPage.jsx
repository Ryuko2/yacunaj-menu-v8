import { Link } from 'react-router-dom'
import { FolderTree, Package, SlidersHorizontal, Eye, ExternalLink } from 'lucide-react'

const cards = [
  {
    to: '/app/menu/categories',
    label: 'Categorías',
    desc: 'Orden, iconos y visibilidad',
    Icon: FolderTree,
  },
  {
    to: '/app/menu/items',
    label: 'Productos',
    desc: 'Precios, disponibilidad y fotos',
    Icon: Package,
  },
  {
    to: '/app/menu/modifiers',
    label: 'Modificadores',
    desc: 'Grupos y opciones',
    Icon: SlidersHorizontal,
  },
  {
    to: '/app/menu/preview',
    label: 'Vista previa lista',
    desc: 'Catálogo con simulación de fecha',
    Icon: Eye,
  },
]

export default function MenuHubPage() {
  return (
    <div>
      <h1 className="mb-2 font-heading text-2xl text-[#C9A227] md:text-3xl">Menú (CMS)</h1>
      <p className="mb-6 max-w-2xl font-accent text-sm text-[rgba(245,240,232,0.65)]">
        Edita el catálogo que ven los clientes. Para la experiencia completa (cards, carrito en modo consulta), abre el menú público.
      </p>
      <p className="mb-6">
        <Link
          to="/menu"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-accent text-sm text-[#C9A227] underline"
        >
          <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
          Abrir menú cliente en nueva pestaña
        </Link>
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

import { useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const linkBase = 'font-accent text-sm transition-colors'
const linkPassive = 'text-[rgba(245,240,232,0.85)] hover:text-[#C9A227]'
const linkActive = 'text-[#C9A227] font-medium'

function NavItem({ to, end, children, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkPassive}`}
    >
      {children}
    </NavLink>
  )
}

export default function AppLayout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)

  const closeNav = () => setNavOpen(false)

  const navGroups = (
    <>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <NavLink
          to="/app/counter"
          onClick={closeNav}
          className="font-accent text-xs uppercase tracking-wide text-[rgba(245,240,232,0.55)] hover:text-[#C9A227] md:mr-1"
        >
          Operación
        </NavLink>
        <NavItem to="/app/counter" onClick={closeNav}>
          Mostrador
        </NavItem>
        <NavItem to="/app/orders" onClick={closeNav}>
          Pedidos
        </NavItem>
      </div>
      <div className="flex flex-col gap-2 border-t border-[rgba(201,162,39,0.15)] pt-3 md:flex-row md:items-center md:gap-4 md:border-t-0 md:pt-0">
        <NavLink
          to="/app/menu/items"
          onClick={closeNav}
          className="font-accent text-xs uppercase tracking-wide text-[rgba(245,240,232,0.55)] hover:text-[#C9A227] md:mr-1"
        >
          Menú
        </NavLink>
        <NavItem to="/app/menu/items" onClick={closeNav}>
          Productos
        </NavItem>
        <NavItem to="/app/menu/categories" onClick={closeNav}>
          Categorías
        </NavItem>
        <NavItem to="/app/menu/modifiers" onClick={closeNav}>
          Modificadores
        </NavItem>
        <NavItem to="/app/menu/preview" onClick={closeNav}>
          Vista previa
        </NavItem>
      </div>
      <div className="flex flex-col gap-2 border-t border-[rgba(201,162,39,0.15)] pt-3 md:flex-row md:items-center md:gap-4 md:border-t-0 md:pt-0">
        <NavLink
          to="/app/reports/sales"
          onClick={closeNav}
          className="font-accent text-xs uppercase tracking-wide text-[rgba(245,240,232,0.55)] hover:text-[#C9A227] md:mr-1"
        >
          Reportes
        </NavLink>
        <NavItem to="/app/reports/sales" onClick={closeNav}>
          Ventas
        </NavItem>
        <NavItem to="/app/reports/inventory" onClick={closeNav}>
          Inventario
        </NavItem>
        <NavItem to="/app/reports/costs" onClick={closeNav}>
          Costos
        </NavItem>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#0A1A0F] text-[#F5F0E8]">
      <header className="border-b border-[rgba(201,162,39,0.2)] px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            to="/app/pos"
            className="font-heading text-lg text-[#C9A227]"
            onClick={closeNav}
          >
            Yacunaj OPS
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded border border-[rgba(201,162,39,0.35)] p-2 text-[#C9A227] md:hidden"
              aria-expanded={navOpen}
              aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setNavOpen((o) => !o)}
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <nav className="hidden flex-wrap items-center gap-x-4 gap-y-2 md:flex">{navGroups}</nav>

            <Link
              to="/menu"
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden font-accent text-sm ${linkPassive} md:inline`}
              onClick={closeNav}
            >
              Menú cliente
            </Link>
            <Link
              to="/"
              className={`hidden font-accent text-sm ${linkPassive} sm:inline`}
              onClick={closeNav}
            >
              Menú público
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOut()
                navigate('/login')
              }}
              className="rounded border border-[rgba(201,162,39,0.35)] px-2 py-1 text-xs text-[#C9A227]"
            >
              Salir
            </button>
          </div>
        </div>

        {navOpen && (
          <nav className="mx-auto mt-4 flex max-w-5xl flex-col gap-4 pb-2 md:hidden">
            {navGroups}
            <div className="flex flex-col gap-2 border-t border-[rgba(201,162,39,0.15)] pt-3">
              <Link
                to="/menu"
                target="_blank"
                rel="noopener noreferrer"
                className={`font-accent text-sm ${linkPassive}`}
                onClick={closeNav}
              >
                Menú cliente (nueva pestaña)
              </Link>
              <Link to="/" className={`font-accent text-sm ${linkPassive}`} onClick={closeNav}>
                Menú público (inicio)
              </Link>
            </div>
          </nav>
        )}

        {user?.email && (
          <p className="mx-auto mt-1 max-w-5xl font-accent text-xs text-[rgba(245,240,232,0.45)]">
            {user.email}
          </p>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

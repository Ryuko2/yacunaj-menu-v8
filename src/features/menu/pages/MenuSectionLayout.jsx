import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'

const linkCls = ({ isActive }) =>
  clsx(
    'block rounded px-3 py-2 text-sm transition-colors',
    isActive ? 'bg-[rgba(201,162,39,0.15)] text-[#C9A227]' : 'text-[rgba(245,240,232,0.75)] hover:bg-[rgba(201,162,39,0.08)]',
  )

export default function MenuSectionLayout() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-52">
        <p className="mb-2 font-heading text-sm text-[#C9A227]">Menú</p>
        <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
          <NavLink end to="/app/menu" className={linkCls}>
            Resumen
          </NavLink>
          <NavLink to="/app/menu/categories" className={linkCls}>
            Categorías
          </NavLink>
          <NavLink to="/app/menu/items" className={linkCls}>
            Productos
          </NavLink>
          <NavLink to="/app/menu/modifiers" className={linkCls}>
            Modificadores
          </NavLink>
          <NavLink to="/app/menu/preview" className={linkCls}>
            Vista previa
          </NavLink>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}

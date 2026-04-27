import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function AppLayout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0A1A0F] text-[#F5F0E8]">
      <header className="border-b border-[rgba(201,162,39,0.2)] px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link to="/app" className="font-heading text-lg text-[#C9A227]">
            Yacunaj OPS
          </Link>
          <nav className="flex flex-wrap items-center gap-3 font-accent text-sm">
            <Link to="/app/menu/items" className="text-[rgba(245,240,232,0.85)] hover:text-[#C9A227]">
              Menú CMS
            </Link>
            <Link to="/app/counter" className="text-[rgba(245,240,232,0.85)] hover:text-[#C9A227]">
              Mostrador
            </Link>
            <Link to="/" className="text-[rgba(245,240,232,0.6)] hover:text-[#C9A227]">
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
          </nav>
        </div>
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

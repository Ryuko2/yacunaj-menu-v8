import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useMenuItemsAdmin } from '../hooks'
import { menuAdminFetch } from '../api'

export default function MenuItemsPage() {
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300)
    return () => clearTimeout(t)
  }, [q])
  const { data, isLoading, refetch } = useMenuItemsAdmin({ page: 1, limit: 50, q: debounced || undefined })
  const items = data?.items || []

  const toggleStock = useCallback(
    async (id, out) => {
      try {
        await menuAdminFetch(`/items/${id}/toggle-availability`, { method: 'PATCH', body: { out_of_stock: out } })
        toast.success(out ? 'Marcado como agotado' : 'Disponible de nuevo')
        refetch()
      } catch (e) {
        toast.error(e.message)
      }
    },
    [refetch],
  )

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl text-[#C9A227]">Productos</h1>
        <Link
          to="/app/menu/items/new"
          className="inline-flex justify-center rounded bg-gradient-to-br from-[#C9A227] to-[#D4AF37] px-4 py-2 font-accent text-sm font-semibold text-[#0A1A0F]"
        >
          Nuevo producto
        </Link>
      </div>
      <label className="mb-4 block font-accent text-xs text-[rgba(245,240,232,0.65)]">
        Buscar
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mt-1 w-full max-w-md rounded border border-[rgba(201,162,39,0.25)] bg-[rgba(10,26,15,0.6)] px-3 py-2 font-accent text-sm text-[#F5F0E8]"
          placeholder="Nombre…"
        />
      </label>
      {isLoading ? (
        <p className="font-accent text-sm text-[rgba(245,240,232,0.6)]">Cargando…</p>
      ) : (
        <div className="overflow-x-auto rounded border border-[rgba(201,162,39,0.15)]">
          <table className="w-full min-w-[640px] text-left font-accent text-sm">
            <thead className="bg-[rgba(201,162,39,0.08)] text-xs uppercase tracking-wide text-[rgba(245,240,232,0.7)]">
              <tr>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Precio</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Agotado</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-[rgba(201,162,39,0.1)]">
                  <td className="px-3 py-2 text-[#F5F0E8]">{it.name}</td>
                  <td className="px-3 py-2 text-[rgba(245,240,232,0.85)]">{it.price != null ? `$${it.price}` : '—'}</td>
                  <td className="px-3 py-2">{it.active ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleStock(it.id, !it.out_of_stock)}
                      className="text-xs text-[#C9A227] underline"
                    >
                      {it.out_of_stock ? 'En stock' : 'Agotado'}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/app/menu/items/${it.id}`} className="text-[#C9A227] underline">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

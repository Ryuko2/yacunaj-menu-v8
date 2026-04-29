import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSuppliers, useSupplierMutations } from '../hooks'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

export default function SuppliersPage() {
  const q = useSuppliers()
  const { create, update } = useSupplierMutations()
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  const suppliers = q.data?.suppliers ?? []

  return (
    <div className="text-[#F5F0E8]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-2xl text-[#C9A227]">Proveedores</h1>
        <div className="flex gap-2">
          <Link to="/app/reports/inventory" className="font-accent text-sm text-[#C9A227] underline">
            ← Inventario
          </Link>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded border border-[#C9A227] px-3 py-1 font-accent text-sm text-[#C9A227]"
          >
            Nuevo
          </button>
        </div>
      </div>

      {q.isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(201,162,39,0.2)]">
          <table className="w-full font-accent text-sm">
            <thead className="bg-[#152B1A] text-left text-[rgba(245,240,232,0.65)]">
              <tr>
                <th className="p-2">Nombre</th>
                <th className="p-2">Teléfono</th>
                <th className="p-2">Email</th>
                <th className="p-2">30d</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-t border-[rgba(201,162,39,0.1)]">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.phone || '—'}</td>
                  <td className="p-2">{s.email || '—'}</td>
                  <td className="p-2">${Number(s.total_30d || 0).toFixed(2)}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      className="text-[#C9A227] underline"
                      onClick={() => setEditing(s)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <SupplierModal
          initial={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSave={async (body) => {
            if (editing) await update.mutateAsync({ id: editing.id, body })
            else await create.mutateAsync(body)
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function SupplierModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    name: initial?.name || '',
    contact: initial?.contact || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    notes: initial?.notes || '',
    active: initial?.active !== false,
  }))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#C9A227] bg-[#0A1A0F] p-6 font-accent text-sm">
        <h3 className="mb-4 font-heading text-lg text-[#C9A227]">
          {initial ? 'Editar proveedor' : 'Nuevo proveedor'}
        </h3>
        {['name', 'contact', 'phone', 'email', 'notes'].map((f) => (
          <label key={f} className="mt-2 block">
            {f}
            <input
              className="mt-1 w-full rounded border border-[rgba(201,162,39,0.35)] bg-[#152B1A] px-2 py-1"
              value={form[f]}
              onChange={(e) => setForm((s) => ({ ...s, [f]: e.target.value }))}
            />
          </label>
        ))}
        <label className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))}
          />
          Activo
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border px-3 py-1">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            className="rounded bg-[#C9A227] px-3 py-1 text-[#0A1A0F]"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

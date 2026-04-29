import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInventoryList, useInventoryReorder, useInventoryMutations, useSuppliers } from '../hooks'
import { downloadCsv } from '../../../lib/exportCsv'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

export default function InventoryReportPage() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const listQ = useInventoryList({ q, ...(category ? { category } : {}) })
  const reorderQ = useInventoryReorder()
  const suppliersQ = useSuppliers()
  const { createItem, updateItem, movement } = useInventoryMutations()

  const kpis = useMemo(() => {
    const items = listQ.data?.items ?? []
    const reorder = reorderQ.data?.items ?? []
    const low = reorder.length
    const n = items.length
    const value = items.reduce(
      (a, i) => a + Number(i.stock_qty || 0) * Number(i.cost_per_unit || 0),
      0
    )
    const spend =
      suppliersQ.data?.suppliers?.reduce((a, s) => a + Number(s.total_30d || 0), 0) ?? 0
    return { n, low, value, spend }
  }, [listQ.data, reorderQ.data, suppliersQ.data])

  const items = listQ.data?.items ?? []
  const reorder = reorderQ.data?.items ?? []

  const [newOpen, setNewOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [movItem, setMovItem] = useState(null)

  const exportAll = () => {
    const rows = items.map((i) => [
      i.name,
      i.sku || '',
      i.category || '',
      String(i.stock_qty),
      String(i.cost_per_unit),
      String(Number(i.stock_qty || 0) * Number(i.cost_per_unit || 0)),
    ])
    downloadCsv(`inventario-${new Date().toISOString().slice(0, 10)}.csv`, [
      'nombre',
      'sku',
      'categoria',
      'stock',
      'costo_unit',
      'valor_linea',
    ], rows)
  }

  return (
    <div className="text-[#F5F0E8]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl text-[#C9A227]">Inventario</h1>
        <Link
          to="/app/reports/inventory/suppliers"
          className="font-accent text-sm text-[#C9A227] underline"
        >
          Proveedores
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Artículos" value={String(kpis.n)} />
        <Kpi label="Bajo mínimo" value={String(kpis.low)} />
        <Kpi label="Valor inventario" value={`$${kpis.value.toFixed(2)}`} />
        <Kpi label="Compras 30d" value={`$${kpis.spend.toFixed(2)}`} />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="rounded border border-[#C9A227] px-3 py-2 font-accent text-sm text-[#C9A227]"
        >
          Nuevo producto
        </button>
        <button
          type="button"
          onClick={exportAll}
          className="rounded border border-[rgba(201,162,39,0.4)] px-3 py-2 font-accent text-sm text-[#F5F0E8]"
        >
          Exportar CSV
        </button>
      </div>

      <h2 className="mb-2 font-heading text-lg text-[#C9A227]">Por surtir</h2>
      {reorderQ.isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="mb-8 overflow-x-auto rounded-xl border border-[rgba(201,162,39,0.2)]">
          <table className="w-full font-accent text-sm">
            <thead className="bg-[#152B1A] text-left text-[rgba(245,240,232,0.65)]">
              <tr>
                <th className="p-2">Producto</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Reorden</th>
                <th className="p-2">Sugerido</th>
                <th className="p-2">Proveedor</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {reorder.map((r) => (
                <tr key={r.id} className="border-t border-[rgba(201,162,39,0.1)]">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.stock_qty}</td>
                  <td className="p-2">{r.reorder_point}</td>
                  <td className="p-2">{r.suggested_qty}</td>
                  <td className="p-2">{r.supplier_name || '—'}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      className="text-[#C9A227] underline"
                      onClick={() => setMovItem(r)}
                    >
                      Registrar entrada
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mb-2 font-heading text-lg text-[#C9A227]">Inventario completo</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          placeholder="Buscar…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded border border-[rgba(201,162,39,0.35)] bg-[#152B1A] px-2 py-1 font-accent text-sm"
        />
        <input
          placeholder="Categoría"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded border border-[rgba(201,162,39,0.35)] bg-[#152B1A] px-2 py-1 font-accent text-sm"
        />
      </div>

      {listQ.isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(201,162,39,0.2)]">
          <table className="w-full font-accent text-sm">
            <thead className="bg-[#152B1A] text-left text-[rgba(245,240,232,0.65)]">
              <tr>
                <th className="p-2">Nombre</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Mín.</th>
                <th className="p-2">Costo</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-[rgba(201,162,39,0.1)]">
                  <td className="p-2">{i.name}</td>
                  <td className="p-2">{i.stock_qty}</td>
                  <td className="p-2">{i.reorder_point}</td>
                  <td className="p-2">{i.cost_per_unit}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      className="text-[#C9A227] underline"
                      onClick={() => setEditItem(i)}
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

      {newOpen && (
        <ItemModal
          title="Nuevo producto"
          onClose={() => setNewOpen(false)}
          onSave={async (body) => {
            await createItem.mutateAsync(body)
            setNewOpen(false)
          }}
        />
      )}
      {editItem && (
        <ItemModal
          title="Editar producto"
          initial={editItem}
          onClose={() => setEditItem(null)}
          onSave={async (body) => {
            await updateItem.mutateAsync({ id: editItem.id, body })
            setEditItem(null)
          }}
        />
      )}
      {movItem && (
        <MovementModal
          item={movItem}
          onClose={() => setMovItem(null)}
          onSave={async (body) => {
            await movement.mutateAsync({ id: movItem.id, body })
            setMovItem(null)
          }}
        />
      )}
    </div>
  )
}

function Kpi({ label, value }) {
  return (
    <div className="rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[rgba(21,43,26,0.65)] p-4">
      <p className="font-accent text-xs text-[rgba(245,240,232,0.55)]">{label}</p>
      <p className="font-heading text-xl text-[#C9A227]">{value}</p>
    </div>
  )
}

function ItemModal({ title, initial, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    name: initial?.name || '',
    sku: initial?.sku || '',
    unit: initial?.unit || 'pza',
    category: initial?.category || '',
    stock_qty: initial?.stock_qty ?? 0,
    reorder_point: initial?.reorder_point ?? 0,
    reorder_qty: initial?.reorder_qty ?? 0,
    cost_per_unit: initial?.cost_per_unit ?? 0,
    supplier_id: initial?.supplier_id || '',
  }))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#C9A227] bg-[#0A1A0F] p-6">
        <h3 className="mb-4 font-heading text-lg text-[#C9A227]">{title}</h3>
        <div className="space-y-2 font-accent text-sm">
          {['name', 'sku', 'unit', 'category', 'supplier_id'].map((f) => (
            <label key={f} className="block">
              {f}
              <input
                className="mt-1 w-full rounded border border-[rgba(201,162,39,0.35)] bg-[#152B1A] px-2 py-1"
                value={form[f]}
                onChange={(e) => setForm((s) => ({ ...s, [f]: e.target.value }))}
              />
            </label>
          ))}
          {['stock_qty', 'reorder_point', 'reorder_qty', 'cost_per_unit'].map((f) => (
            <label key={f} className="block">
              {f}
              <input
                type="number"
                className="mt-1 w-full rounded border border-[rgba(201,162,39,0.35)] bg-[#152B1A] px-2 py-1"
                value={form[f]}
                onChange={(e) => setForm((s) => ({ ...s, [f]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border px-3 py-1">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({
                ...form,
                stock_qty: parseFloat(form.stock_qty),
                reorder_point: parseFloat(form.reorder_point),
                reorder_qty: parseFloat(form.reorder_qty),
                cost_per_unit: parseFloat(form.cost_per_unit),
                supplier_id: form.supplier_id || null,
              })
            }
            className="rounded bg-[#C9A227] px-3 py-1 text-[#0A1A0F]"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function MovementModal({ item, onClose, onSave }) {
  const [qty, setQty] = useState(String(item.suggested_qty || 1))
  const [unitCost, setUnitCost] = useState(String(item.cost_per_unit ?? 0))
  const [createPurchase, setCreatePurchase] = useState(true)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#C9A227] bg-[#0A1A0F] p-6 font-accent text-sm">
        <h3 className="mb-2 font-heading text-lg text-[#C9A227]">Entrada — {item.name}</h3>
        <label className="block">
          Cantidad
          <input
            className="mt-1 w-full rounded border border-[rgba(201,162,39,0.35)] bg-[#152B1A] px-2 py-1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </label>
        <label className="mt-3 block">
          Costo unitario
          <input
            className="mt-1 w-full rounded border border-[rgba(201,162,39,0.35)] bg-[#152B1A] px-2 py-1"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
          />
        </label>
        <label className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={createPurchase}
            onChange={(e) => setCreatePurchase(e.target.checked)}
          />
          Registrar compra agregada
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border px-3 py-1">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({
                kind: 'purchase',
                qty: parseFloat(qty),
                unit_cost: parseFloat(unitCost),
                create_purchase: createPurchase,
              })
            }
            className="rounded bg-[#C9A227] px-3 py-1 text-[#0A1A0F]"
          >
            Registrar
          </button>
        </div>
      </div>
    </div>
  )
}

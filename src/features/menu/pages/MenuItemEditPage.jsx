import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useMenuItemDetail, useSetItemPrice, usePatchItem } from '../hooks'
import { menuAdminFetch } from '../api'
import { MenuPublicPreview } from '../components/MenuPublicPreview'

const infoSchema = z.object({
  name: z.string().min(1),
  description_short: z.string().optional().nullable(),
  description_long: z.string().optional().nullable(),
  active: z.boolean().optional(),
  out_of_stock: z.boolean().optional(),
  featured: z.boolean().optional(),
  seasonal: z.boolean().optional(),
  can_be_hot: z.boolean().optional(),
})

export default function MenuItemEditPage() {
  const { id } = useParams()
  const { data, isLoading, refetch } = useMenuItemDetail(id)
  const patchItem = usePatchItem()
  const setPrice = useSetItemPrice()
  const [tab, setTab] = useState('info')
  const [priceDlg, setPriceDlg] = useState(false)
  const [newPrice, setNewPrice] = useState('')
  const [reason, setReason] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)

  const item = data?.item

  const form = useForm({
    resolver: zodResolver(infoSchema),
    defaultValues: { name: '', description_short: '', description_long: '', active: true, out_of_stock: false, featured: false, seasonal: false, can_be_hot: false },
  })

  useEffect(() => {
    if (!item) return
    form.reset({
      name: item.name || '',
      description_short: item.description_short || item.description || '',
      description_long: item.description_long || '',
      active: !!item.active,
      out_of_stock: !!item.out_of_stock,
      featured: !!item.featured,
      seasonal: !!item.seasonal,
      can_be_hot: !!item.can_be_hot,
    })
  }, [item, form])

  const onSaveInfo = form.handleSubmit(async (vals) => {
    try {
      await patchItem.mutateAsync({ id, patch: vals })
      toast.success('Guardado')
      refetch()
    } catch (e) {
      toast.error(e.message)
    }
  })

  const applyPrice = async () => {
    const p = Number(newPrice)
    if (Number.isNaN(p) || p < 0) return toast.error('Precio inválido')
    if (reason.trim().length < 5) return toast.error('El motivo debe tener al menos 5 caracteres')
    try {
      await setPrice.mutateAsync({ id, price: p, reason: reason.trim() })
      toast.success('Precio actualizado')
      setPriceDlg(false)
      setReason('')
      refetch()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (isLoading || !item) return <p className="font-accent text-sm text-[rgba(245,240,232,0.6)]">Cargando…</p>

  const logs = data?.price_changes || []

  return (
    <div>
      <div className="sticky top-0 z-10 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(201,162,39,0.2)] bg-[#0A1A0F] pb-3">
        <div>
          <h1 className="font-heading text-xl text-[#C9A227]">{item.name}</h1>
          <p className="font-accent text-xs text-[rgba(245,240,232,0.45)]">{item.active ? 'Activo' : 'Inactivo'} · {item.out_of_stock ? 'Agotado' : 'Disponible'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onSaveInfo} className="rounded border border-[#C9A227] px-3 py-1.5 font-accent text-xs text-[#C9A227]">
            Guardar
          </button>
          <button type="button" onClick={() => setPriceDlg(true)} className="rounded border border-[rgba(201,162,39,0.35)] px-3 py-1.5 font-accent text-xs text-[#F5F0E8]">
            Cambiar precio…
          </button>
          <button type="button" onClick={() => setPreviewOpen(true)} className="rounded border border-[rgba(201,162,39,0.35)] px-3 py-1.5 font-accent text-xs text-[#F5F0E8]">
            Vista previa
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2 border-b border-[rgba(201,162,39,0.12)] font-accent text-sm">
        {['info', 'price', 'modifiers', 'recipe', 'photo'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-2 py-2 capitalize ${tab === t ? 'border-[#C9A227] text-[#C9A227]' : 'border-transparent text-[rgba(245,240,232,0.55)]'}`}
          >
            {t === 'info' ? 'Información' : t === 'price' ? 'Precio' : t === 'modifiers' ? 'Modificadores' : t === 'recipe' ? 'Receta' : 'Foto'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <form className="max-w-xl space-y-3 font-accent text-sm" onSubmit={(e) => e.preventDefault()}>
          <label className="block">
            <span className="text-[rgba(245,240,232,0.7)]">Nombre</span>
            <input className="mt-1 w-full rounded border border-[rgba(201,162,39,0.25)] bg-[rgba(10,26,15,0.6)] px-3 py-2 text-[#F5F0E8]" {...form.register('name')} />
          </label>
          <label className="block">
            <span className="text-[rgba(245,240,232,0.7)]">Descripción corta</span>
            <input className="mt-1 w-full rounded border border-[rgba(201,162,39,0.25)] bg-[rgba(10,26,15,0.6)] px-3 py-2 text-[#F5F0E8]" {...form.register('description_short')} />
          </label>
          <label className="block">
            <span className="text-[rgba(245,240,232,0.7)]">Descripción larga</span>
            <textarea rows={4} className="mt-1 w-full rounded border border-[rgba(201,162,39,0.25)] bg-[rgba(10,26,15,0.6)] px-3 py-2 text-[#F5F0E8]" {...form.register('description_long')} />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register('active')} />
              Activo
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register('out_of_stock')} />
              Agotado
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register('featured')} />
              Destacado
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register('seasonal')} />
              Estacional
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register('can_be_hot')} />
              Puede ser caliente
            </label>
          </div>
        </form>
      )}

      {tab === 'price' && (
        <div className="max-w-xl font-accent text-sm">
          <p className="mb-2 text-[rgba(245,240,232,0.75)]">Precio actual: <strong className="text-[#C9A227]">${item.price ?? '—'}</strong></p>
          <p className="mb-4 text-xs text-[rgba(245,240,232,0.5)]">Usa el botón «Cambiar precio» arriba para registrar motivo en auditoría.</p>
          <h3 className="mb-2 font-heading text-sm text-[#C9A227]">Historial de cambios</h3>
          <ul className="space-y-2 text-xs">
            {logs.length === 0 && <li className="text-[rgba(245,240,232,0.45)]">Sin registros</li>}
            {logs.map((l) => (
              <li key={l.id} className="rounded border border-[rgba(201,162,39,0.12)] bg-[rgba(13,32,16,0.4)] px-2 py-2">
                ${l.old_price} → ${l.new_price}
                {l.reason ? ` · ${l.reason}` : ''}
                <span className="block text-[rgba(245,240,232,0.4)]">{new Date(l.created_at).toLocaleString('es-MX')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'modifiers' && (
        <div className="font-accent text-sm text-[rgba(245,240,232,0.75)]">
          <p className="mb-2">Grupos asignados (IDs):</p>
          <ul className="list-disc pl-5">
            {(data?.modifier_group_links || []).map((l) => (
              <li key={l.id}>{l.modifier_group_id}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[rgba(245,240,232,0.45)]">Asignación detallada con drag-and-drop en la siguiente iteración; el backend ya expone POST /items/:id/modifier-groups.</p>
        </div>
      )}

      {tab === 'recipe' && (
        <div className="rounded border border-dashed border-[rgba(201,162,39,0.25)] p-6 text-center font-accent text-sm text-[rgba(245,240,232,0.65)]">
          Receta (BOM): preparado para Fase 3. Inventario vacío.
        </div>
      )}

      {tab === 'photo' && (
        <div className="font-accent text-sm">
          <p className="mb-2 text-[rgba(245,240,232,0.75)]">Imagen actual: {item.image_url || 'ninguna'}</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const fd = new FormData()
              fd.append('file', f)
              try {
                const { data: { session } } = await supabase.auth.getSession()
                const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
                const res = await fetch(`${base}/api/menu/items/${id}/image`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${session?.access_token}` },
                  body: fd,
                })
                const j = await res.json()
                if (!res.ok) throw new Error(j.error || res.statusText)
                await menuAdminFetch(`/items/${id}`, { method: 'PATCH', body: { image_url: j.url } })
                toast.success('Imagen subida')
                refetch()
              } catch (err) {
                toast.error(err.message)
              }
            }}
          />
        </div>
      )}

      {priceDlg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded border border-[rgba(201,162,39,0.3)] bg-[#0D2010] p-6 font-accent text-sm">
            <h3 className="mb-3 font-heading text-lg text-[#C9A227]">Cambiar precio</h3>
            <label className="mb-2 block">
              Nuevo precio (MXN)
              <input
                type="number"
                className="mt-1 w-full rounded border border-[rgba(201,162,39,0.25)] bg-[rgba(10,26,15,0.6)] px-3 py-2 text-[#F5F0E8]"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
            </label>
            <label className="mb-4 block">
              Motivo (mín. 5 caracteres)
              <textarea className="mt-1 w-full rounded border border-[rgba(201,162,39,0.25)] bg-[rgba(10,26,15,0.6)] px-3 py-2 text-[#F5F0E8]" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPriceDlg(false)} className="rounded px-3 py-1.5 text-xs text-[rgba(245,240,232,0.7)]">
                Cancelar
              </button>
              <button type="button" onClick={applyPrice} className="rounded bg-[#C9A227] px-3 py-1.5 text-xs font-semibold text-[#0A1A0F]">
                Guardar precio
              </button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4">
          <div className="mx-auto max-w-md rounded border border-[rgba(201,162,39,0.25)] bg-[#0A1A0F] p-4">
            <div className="mb-3 flex justify-between">
              <h3 className="font-heading text-[#C9A227]">Vista previa pública</h3>
              <button type="button" onClick={() => setPreviewOpen(false)} className="text-[#F5F0E8]">
                Cerrar
              </button>
            </div>
            <MenuPublicPreview highlightItemId={id} />
          </div>
        </div>
      )}
    </div>
  )
}

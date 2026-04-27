import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { menuAdminFetch } from '../api'
import { useCategories } from '../hooks'
import { EMPTY_ARRAY } from '../emptyRefs'

const schema = z.object({
  name: z.string().min(1),
  category_id: z.string().uuid().optional().nullable(),
  price: z.coerce.number().nonnegative().optional().nullable(),
})

export default function MenuItemNewPage() {
  const navigate = useNavigate()
  const { data } = useCategories()
  const cats = data ?? EMPTY_ARRAY
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: '', category_id: '', price: null } })

  const onSubmit = form.handleSubmit(async (vals) => {
    try {
      const body = {
        name: vals.name,
        category_id: vals.category_id || null,
        price: vals.price ?? null,
        active: true,
        out_of_stock: false,
      }
      const created = await menuAdminFetch('/items', { method: 'POST', body })
      toast.success('Producto creado')
      navigate(`/app/menu/items/${created.id}`)
    } catch (e) {
      toast.error(e.message)
    }
  })

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-[#C9A227]">Nuevo producto</h1>
      <form onSubmit={onSubmit} className="max-w-md space-y-3 font-accent text-sm">
        <label className="block">
          Nombre
          <input className="mt-1 w-full rounded border border-[rgba(201,162,39,0.25)] bg-[rgba(10,26,15,0.6)] px-3 py-2 text-[#F5F0E8]" {...form.register('name')} />
        </label>
        <label className="block">
          Categoría
          <select className="mt-1 w-full rounded border border-[rgba(201,162,39,0.25)] bg-[rgba(10,26,15,0.6)] px-3 py-2 text-[#F5F0E8]" {...form.register('category_id')}>
            <option value="">—</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </label>
        <label className="block">
          Precio base
          <input type="number" step="0.01" className="mt-1 w-full rounded border border-[rgba(201,162,39,0.25)] bg-[rgba(10,26,15,0.6)] px-3 py-2 text-[#F5F0E8]" {...form.register('price')} />
        </label>
        <button type="submit" className="rounded bg-[#C9A227] px-4 py-2 font-semibold text-[#0A1A0F]">
          Guardar y continuar
        </button>
      </form>
    </div>
  )
}

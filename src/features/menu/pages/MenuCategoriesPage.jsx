import { useMemo, useState, useEffect } from 'react'
import { EMPTY_ARRAY } from '../emptyRefs'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { useCategories, useReorderCategories } from '../hooks'
import { menuAdminFetch } from '../api'

function Row({ cat, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded border border-[rgba(201,162,39,0.2)] bg-[rgba(13,32,16,0.5)] px-3 py-2"
    >
      <button type="button" className="cursor-grab text-[#C9A227] active:cursor-grabbing" {...attributes} {...listeners}>
        ⋮⋮
      </button>
      <span className="text-xl">{cat.icono || '📁'}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-accent text-sm text-[#F5F0E8]">{cat.nombre}</p>
        <p className="font-accent text-xs text-[rgba(245,240,232,0.45)]">{cat.slug}</p>
      </div>
      <span className="rounded bg-[rgba(201,162,39,0.12)] px-2 py-0.5 font-accent text-xs text-[#C9A227]">
        {cat.activa ? 'Activa' : 'Inactiva'}
      </span>
      <button type="button" onClick={() => onEdit(cat)} className="font-accent text-xs text-[#C9A227] underline">
        Editar
      </button>
    </div>
  )
}

export default function MenuCategoriesPage() {
  const { data, isLoading, refetch } = useCategories()
  const cats = data ?? EMPTY_ARRAY
  const reorder = useReorderCategories()
  const [localCats, setLocalCats] = useState([])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => {
    setLocalCats(cats)
  }, [cats])

  const roots = useMemo(
    () => localCats.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order),
    [localCats],
  )

  const onDragEnd = async (e) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const list = [...roots]
    const oldIndex = list.findIndex((c) => c.id === active.id)
    const newIndex = list.findIndex((c) => c.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const moved = arrayMove(list, oldIndex, newIndex)
    const nextRoots = moved.map((c, i) => ({ ...c, sort_order: (i + 1) * 10 }))
    const idToOrder = new Map(nextRoots.map((c) => [c.id, c.sort_order]))
    setLocalCats((prev) => prev.map((c) => (idToOrder.has(c.id) ? { ...c, sort_order: idToOrder.get(c.id) } : c)))
    try {
      await reorder.mutateAsync(nextRoots.map((c) => ({ id: c.id, sort_order: c.sort_order })))
      toast.success('Orden guardado')
      refetch()
    } catch (err) {
      toast.error(err.message)
      setLocalCats(cats)
    }
  }

  const onEdit = async (cat) => {
    const nombre = window.prompt('Nombre de categoría', cat.nombre)
    if (nombre == null) return
    try {
      await menuAdminFetch(`/categories/${cat.id}`, { method: 'PATCH', body: { nombre } })
      toast.success('Guardado')
      refetch()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const onNew = async () => {
    const nombre = window.prompt('Nombre de la nueva categoría')
    if (!nombre) return
    const slug = window.prompt('Slug (solo minúsculas y guiones)', nombre.toLowerCase().replace(/\s+/g, '-'))
    if (!slug) return
    try {
      await menuAdminFetch('/categories', {
        method: 'POST',
        body: { nombre, slug, activa: true, sort_order: (cats.length + 1) * 10 },
      })
      toast.success('Categoría creada')
      refetch()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (isLoading) return <p className="font-accent text-sm text-[rgba(245,240,232,0.6)]">Cargando…</p>

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl text-[#C9A227]">Categorías</h1>
        <button
          type="button"
          onClick={onNew}
          className="rounded bg-gradient-to-br from-[#C9A227] to-[#D4AF37] px-4 py-2 font-accent text-sm font-semibold text-[#0A1A0F]"
        >
          Nueva categoría
        </button>
      </div>
      <p className="mb-4 font-accent text-xs text-[rgba(245,240,232,0.55)]">
        Arrastra para reordenar. Subcategorías: usa PATCH con parent_id desde SQL o extiende esta UI.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={roots.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {roots.map((c) => (
              <Row key={c.id} cat={c} onEdit={onEdit} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

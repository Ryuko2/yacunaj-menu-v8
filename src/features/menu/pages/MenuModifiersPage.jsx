import { useState } from 'react'
import { toast } from 'sonner'
import { useModifierGroups, useModifiers } from '../hooks'
import { menuAdminFetch } from '../api'
import { EMPTY_ARRAY } from '../emptyRefs'

export default function MenuModifiersPage() {
  const [tab, setTab] = useState('groups')
  const [groupId, setGroupId] = useState(null)
  const { data: groupsData, refetch: rg } = useModifierGroups()
  const { data: modsData } = useModifiers(groupId)
  const groups = groupsData ?? EMPTY_ARRAY
  const mods = modsData ?? EMPTY_ARRAY
  const addGroup = async () => {
    const nombre = window.prompt('Nombre del grupo')
    if (!nombre) return
    const slug = window.prompt('Slug', nombre.toLowerCase().replace(/\s+/g, '-'))
    if (!slug) return
    try {
      await menuAdminFetch('/modifier-groups', {
        method: 'POST',
        body: { slug, nombre, selection_type: 'single', required: false, min_selections: 0, active: true },
      })
      toast.success('Grupo creado')
      rg()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div>
      <div className="mb-4 flex gap-2 border-b border-[rgba(201,162,39,0.15)] font-accent text-sm">
        <button type="button" className={tab === 'groups' ? 'border-b-2 border-[#C9A227] pb-2 text-[#C9A227]' : 'pb-2 text-[rgba(245,240,232,0.55)]'} onClick={() => setTab('groups')}>
          Grupos
        </button>
        <button type="button" className={tab === 'opts' ? 'border-b-2 border-[#C9A227] pb-2 text-[#C9A227]' : 'pb-2 text-[rgba(245,240,232,0.55)]'} onClick={() => setTab('opts')}>
          Opciones
        </button>
      </div>
      {tab === 'groups' && (
        <div>
          <div className="mb-4 flex justify-between">
            <h1 className="font-heading text-xl text-[#C9A227]">Grupos de modificadores</h1>
            <button type="button" onClick={addGroup} className="rounded bg-[#C9A227] px-3 py-1.5 font-accent text-xs font-semibold text-[#0A1A0F]">
              Nuevo grupo
            </button>
          </div>
          <ul className="space-y-2 font-accent text-sm">
            {groups.map((g) => (
              <li key={g.id} className="flex items-center justify-between rounded border border-[rgba(201,162,39,0.15)] px-3 py-2">
                <span>{g.nombre} <span className="text-xs text-[rgba(245,240,232,0.45)]">({g.selection_type})</span></span>
                <button type="button" className="text-xs text-[#C9A227] underline" onClick={() => { setGroupId(g.id); setTab('opts') }}>
                  Ver opciones
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tab === 'opts' && (
        <div>
          <label className="mb-2 block font-accent text-xs text-[rgba(245,240,232,0.65)]">
            Grupo
            <select
              className="mt-1 w-full max-w-xs rounded border border-[rgba(201,162,39,0.25)] bg-[rgba(10,26,15,0.6)] px-2 py-1 text-[#F5F0E8]"
              value={groupId || ''}
              onChange={(e) => setGroupId(e.target.value || null)}
            >
              <option value="">Todos</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </label>
          <ul className="mt-4 space-y-1 font-accent text-xs">
            {mods.map((m) => (
              <li key={m.id} className="flex justify-between rounded bg-[rgba(13,32,16,0.5)] px-2 py-1">
                <span>{m.nombre}</span>
                <span>+${m.price_extra}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

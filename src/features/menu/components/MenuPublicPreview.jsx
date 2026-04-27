import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

/** Vista previa del menú público (misma estructura que get_menu_public_catalog). */
export function MenuPublicPreview({ highlightItemId }) {
  const [cats, setCats] = useState([])
  const [at, setAt] = useState(() => new Date().toISOString().slice(0, 16))

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase.rpc('get_menu_public_catalog', { p_at: new Date(at).toISOString() })
        if (error) throw error
        const payload = typeof data === 'string' ? JSON.parse(data) : data
        if (!cancelled) setCats(payload?.categories || [])
      } catch {
        if (!cancelled) setCats([])
      }
    })()
    return () => { cancelled = true }
  }, [at])

  return (
    <div className="font-accent text-sm text-[#F5F0E8]">
      <label className="mb-3 block text-xs text-[rgba(245,240,232,0.65)]">
        Simular fecha y hora
        <input
          type="datetime-local"
          value={at}
          onChange={(e) => setAt(e.target.value)}
          className="mt-1 w-full rounded border border-[rgba(201,162,39,0.25)] bg-[rgba(10,26,15,0.6)] px-2 py-1 text-[#F5F0E8]"
        />
      </label>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto">
        {cats.map((c) => (
          <div key={c.id}>
            <h4 className="mb-1 font-heading text-[#C9A227]">{c.name}</h4>
            <ul className="space-y-1 text-xs">
              {(c.items || []).map((it) => (
                <li
                  key={it.id}
                  className={highlightItemId && String(it.id) === String(highlightItemId) ? 'rounded bg-[rgba(201,162,39,0.15)] px-2 py-1' : 'px-2 py-1'}
                >
                  {it.name} — {it.price != null ? `$${it.price}` : 'variable'}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

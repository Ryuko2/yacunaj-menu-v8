import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { format, subDays } from 'date-fns'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { useCostsReport, useMarginsItems, useMarginsLow } from '../hooks'
import { menuAdminFetch } from '../../menu/api'
import { downloadCsv } from '../../../lib/exportCsv'

function defaultRange() {
  const to = new Date()
  const from = subDays(to, 29)
  return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') }
}

export default function CostsReportPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const def = useMemo(() => defaultRange(), [])
  const from = searchParams.get('from') || def.from
  const to = searchParams.get('to') || def.to
  const threshold = searchParams.get('threshold') || '20'

  useEffect(() => {
    if (!searchParams.get('from') || !searchParams.get('to')) {
      const next = new URLSearchParams(searchParams)
      if (!next.get('from')) next.set('from', def.from)
      if (!next.get('to')) next.set('to', def.to)
      if (!next.get('threshold')) next.set('threshold', '20')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams, def.from, def.to])

  const setField = (key, value) => {
    const next = new URLSearchParams(searchParams)
    next.set(key, value)
    setSearchParams(next)
  }

  const qCosts = useCostsReport({ from, to })
  const qTop = useMarginsItems({ from, to, limit: '10' })
  const qLow = useMarginsLow({ threshold })

  const [quickCost, setQuickCost] = useState({})
  const series = qCosts.data?.series ?? []
  const totals = qCosts.data?.totals
  const top = qTop.data?.items ?? []
  const low = qLow.data?.items ?? []

  const exportCsvAll = () => {
    const rows = []
    for (const r of series) {
      rows.push(['dia', r.day, 'revenue', String(r.revenue)])
      rows.push(['dia', r.day, 'cogs', String(r.cogs)])
      rows.push(['dia', r.day, 'gross_profit', String(r.gross_profit)])
    }
    for (const t of top) {
      rows.push(['top', t.item_name, 'gross_profit', String(t.gross_profit)])
    }
    downloadCsv(`reporte-costos-${from}_${to}.csv`, ['section', 'key', 'metric', 'value'], rows)
  }

  const saveEstimatedCost = async (itemId, value) => {
    const n = parseFloat(value)
    if (Number.isNaN(n) || !itemId) return
    await menuAdminFetch(`/items/${itemId}`, { method: 'PATCH', body: { estimated_cost: n } })
    await qTop.refetch()
    await qLow.refetch()
  }

  const chartData = series.map((r) => ({
    ...r,
    margin_pct: r.margin_pct ?? 0,
  }))

  return (
    <div className="text-[#F5F0E8]">
      <h1 className="mb-4 font-heading text-2xl text-[#C9A227]">Costos y margen</h1>

      <div className="mb-6 flex flex-wrap gap-3 font-accent text-sm">
        <label className="flex flex-col gap-1">
          Desde
          <input
            type="date"
            value={from}
            onChange={(e) => setField('from', e.target.value)}
            className="rounded border border-[rgba(201,162,39,0.35)] bg-[#152B1A] px-2 py-1 text-[#F5F0E8]"
          />
        </label>
        <label className="flex flex-col gap-1">
          Hasta
          <input
            type="date"
            value={to}
            onChange={(e) => setField('to', e.target.value)}
            className="rounded border border-[rgba(201,162,39,0.35)] bg-[#152B1A] px-2 py-1 text-[#F5F0E8]"
          />
        </label>
        <label className="flex flex-col gap-1">
          Umbral alerta (% margen)
          <input
            type="number"
            value={threshold}
            onChange={(e) => setField('threshold', e.target.value)}
            className="w-24 rounded border border-[rgba(201,162,39,0.35)] bg-[#152B1A] px-2 py-1 text-[#F5F0E8]"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={exportCsvAll}
            className="rounded border border-[#C9A227] px-3 py-1.5 text-[#C9A227]"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {totals && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[rgba(21,43,26,0.65)] p-4">
            <p className="font-accent text-xs text-[rgba(245,240,232,0.55)]">Ingresos</p>
            <p className="font-heading text-xl text-[#C9A227]">${totals.revenue.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[rgba(21,43,26,0.65)] p-4">
            <p className="font-accent text-xs text-[rgba(245,240,232,0.55)]">COGS</p>
            <p className="font-heading text-xl text-[#C9A227]">${totals.cogs.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[rgba(21,43,26,0.65)] p-4">
            <p className="font-accent text-xs text-[rgba(245,240,232,0.55)]">Margen bruto</p>
            <p className="font-heading text-xl text-[#C9A227]">${totals.gross_profit.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[rgba(21,43,26,0.65)] p-4">
            <p className="font-accent text-xs text-[rgba(245,240,232,0.55)]">Margen %</p>
            <p className="font-heading text-xl text-[#C9A227]">
              {totals.margin_pct != null ? `${totals.margin_pct}%` : '—'}
            </p>
          </div>
        </div>
      )}

      <div className="mb-8 h-80 w-full rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[#152B1A] p-4">
        <p className="mb-2 font-accent text-sm text-[#C9A227]">Ingresos vs COGS y margen %</p>
        <ResponsiveContainer width="100%" height="90%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="rgba(201,162,39,0.15)" />
            <XAxis dataKey="day" stroke="#b8b0a2" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" stroke="#b8b0a2" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" stroke="#b8b0a2" tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#0A1A0F', border: '1px solid #C9A227', color: '#F5F0E8' }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" name="Ingresos" fill="#C9A227" opacity={0.85} />
            <Bar yAxisId="left" dataKey="cogs" name="COGS" fill="#6a4c93" opacity={0.85} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="margin_pct"
              name="Margen %"
              stroke="#7cb342"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 font-heading text-lg text-[#C9A227]">Top productos por margen $</h2>
          <div className="overflow-x-auto rounded-xl border border-[rgba(201,162,39,0.2)]">
            <table className="w-full font-accent text-sm">
              <thead className="bg-[#152B1A] text-left text-[rgba(245,240,232,0.65)]">
                <tr>
                  <th className="p-2">Producto</th>
                  <th className="p-2">Margen</th>
                  <th className="p-2">Costo est.</th>
                </tr>
              </thead>
              <tbody>
                {top.map((t) => (
                  <tr key={t.item_id} className="border-t border-[rgba(201,162,39,0.1)]">
                    <td className="p-2">{t.item_name}</td>
                    <td className="p-2">${Number(t.gross_profit).toFixed(2)}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-24 rounded border border-[rgba(201,162,39,0.35)] bg-[#0A1A0F] px-1 py-0.5"
                          placeholder={t.estimated_cost == null ? '—' : String(t.estimated_cost)}
                          value={
                            quickCost[t.item_id] ??
                            (t.estimated_cost != null ? String(t.estimated_cost) : '')
                          }
                          onChange={(e) =>
                            setQuickCost((s) => ({ ...s, [t.item_id]: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          className="text-xs text-[#C9A227] underline"
                          onClick={() => saveEstimatedCost(t.item_id, quickCost[t.item_id] ?? t.estimated_cost)}
                        >
                          Guardar
                        </button>
                      </div>
                      {t.estimated_cost == null && (
                        <span className="mt-1 inline-block rounded bg-amber-900/40 px-2 py-0.5 text-[0.65rem] text-amber-200">
                          sin costo definido
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="mb-2 font-heading text-lg text-[#C9A227]">Margen bajo (&lt; {threshold}%)</h2>
          <div className="overflow-x-auto rounded-xl border border-[rgba(201,162,39,0.2)]">
            <table className="w-full font-accent text-sm">
              <thead className="bg-[#152B1A] text-left text-[rgba(245,240,232,0.65)]">
                <tr>
                  <th className="p-2">Producto</th>
                  <th className="p-2">Precio</th>
                  <th className="p-2">Costo</th>
                  <th className="p-2">Margen %</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {low.map((r) => (
                  <tr key={r.id} className="border-t border-[rgba(201,162,39,0.1)]">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2">${Number(r.price).toFixed(2)}</td>
                    <td className="p-2">
                      {r.estimated_cost == null ? (
                        <span className="inline-block rounded bg-amber-900/40 px-2 py-0.5 text-[0.65rem] text-amber-200">
                          sin costo definido
                        </span>
                      ) : (
                        `$${Number(r.estimated_cost).toFixed(2)}`
                      )}
                    </td>
                    <td className="p-2">{r.margin_pct != null ? `${r.margin_pct}%` : '—'}</td>
                    <td className="p-2">
                      <Link to={`/app/menu/items/${r.id}`} className="text-[#C9A227] underline">
                        Editar costo
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

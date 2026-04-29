import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format, subDays } from 'date-fns'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { useSalesReport, useTopItems } from '../hooks'
import { downloadCsv } from '../../../lib/exportCsv'

const SRC_COLORS = {
  qr: '#2d6a4f',
  crm: '#c9a227',
  staff: '#1d3557',
  admin: '#6a4c93',
}

function defaultRange() {
  const to = new Date()
  const from = subDays(to, 6)
  return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') }
}

export default function SalesReportPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const def = useMemo(() => defaultRange(), [])

  const from = searchParams.get('from') || def.from
  const to = searchParams.get('to') || def.to
  const granularity = searchParams.get('granularity') || 'day'
  const source = searchParams.get('source') || ''

  useEffect(() => {
    if (!searchParams.get('from') || !searchParams.get('to')) {
      const next = new URLSearchParams(searchParams)
      if (!next.get('from')) next.set('from', def.from)
      if (!next.get('to')) next.set('to', def.to)
      if (!next.get('granularity')) next.set('granularity', 'day')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams, def.from, def.to])

  const qSales = useSalesReport({ from, to, granularity, ...(source ? { source } : {}) })
  const qTop = useTopItems({ from, to, limit: '10', ...(source ? { source } : {}) })

  const setField = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value === '' || value == null) next.delete(key)
    else next.set(key, value)
    setSearchParams(next)
  }

  const sales = qSales.data
  const topItems = qTop.data?.items ?? []
  const topTables = sales?.topTables ?? []

  const stackData = useMemo(() => {
    const rows = sales?.seriesBySource || []
    return rows.map((r) => ({
      ...r,
      period: r.period,
    }))
  }, [sales])

  const exportDetail = () => {
    const norm = []
    if (sales?.series) {
      for (const s of sales.series) {
        norm.push(['serie_ingresos', String(s.period), 'revenue', String(s.revenue)])
        norm.push(['serie_ingresos', String(s.period), 'orders', String(s.orders)])
      }
    }
    for (const t of topItems) {
      norm.push(['top_item', t.item_id || t.item_name, 'qty', String(t.qty)])
      norm.push(['top_item', t.item_id || t.item_name, 'revenue', String(t.revenue)])
    }
    for (const tb of topTables) {
      norm.push(['mesa', String(tb.table_number), 'orders', String(tb.orders)])
      norm.push(['mesa', String(tb.table_number), 'revenue', String(tb.revenue)])
    }
    downloadCsv(`reporte-ventas-${from}_${to}.csv`, ['section', 'key', 'metric', 'value'], norm)
  }

  const pct = sales?.kpis?.sourcePct || {}

  return (
    <div className="text-[#F5F0E8]">
      <h1 className="mb-4 font-heading text-2xl text-[#C9A227]">Ventas</h1>

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
          Granularidad
          <select
            value={granularity}
            onChange={(e) => setField('granularity', e.target.value)}
            className="rounded border border-[rgba(201,162,39,0.35)] bg-[#152B1A] px-2 py-1 text-[#F5F0E8]"
          >
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Origen
          <select
            value={source}
            onChange={(e) => setField('source', e.target.value)}
            className="rounded border border-[rgba(201,162,39,0.35)] bg-[#152B1A] px-2 py-1 text-[#F5F0E8]"
          >
            <option value="">Todos</option>
            <option value="qr">QR</option>
            <option value="crm">CRM</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={exportDetail}
            className="rounded border border-[#C9A227] px-3 py-1.5 text-[#C9A227]"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {qSales.isError && (
        <p className="mb-4 text-red-400">{qSales.error?.message || 'Error al cargar'}</p>
      )}

      {sales && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[rgba(21,43,26,0.65)] p-4">
              <p className="font-accent text-xs text-[rgba(245,240,232,0.55)]">Ingresos</p>
              <p className="font-heading text-2xl text-[#C9A227]">
                ${Number(sales.kpis.revenue).toLocaleString('es-MX')}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[rgba(21,43,26,0.65)] p-4">
              <p className="font-accent text-xs text-[rgba(245,240,232,0.55)]">Pedidos</p>
              <p className="font-heading text-2xl text-[#C9A227]">{sales.kpis.orders}</p>
            </div>
            <div className="rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[rgba(21,43,26,0.65)] p-4">
              <p className="font-accent text-xs text-[rgba(245,240,232,0.55)]">Ticket promedio</p>
              <p className="font-heading text-2xl text-[#C9A227]">
                ${Number(sales.kpis.avgTicket).toLocaleString('es-MX')}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[rgba(21,43,26,0.65)] p-4">
              <p className="font-accent text-xs text-[rgba(245,240,232,0.55)]">% ingresos por origen</p>
              <div className="mt-2 flex h-4 w-full overflow-hidden rounded bg-[#0A1A0F]">
                {['qr', 'crm', 'staff', 'admin'].map((k) =>
                  pct[k] > 0 ? (
                    <div
                      key={k}
                      style={{
                        width: `${pct[k]}%`,
                        background: SRC_COLORS[k],
                      }}
                      title={`${k}: ${pct[k]}%`}
                    />
                  ) : null
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 font-accent text-[0.65rem] text-[rgba(245,240,232,0.6)]">
                {Object.entries(pct).map(([k, v]) =>
                  v > 0 ? (
                    <span key={k}>
                      {k}: {v}%
                    </span>
                  ) : null
                )}
              </div>
            </div>
          </div>

          <div className="mb-8 h-72 w-full rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[#152B1A] p-4">
            <p className="mb-2 font-accent text-sm text-[#C9A227]">Ingresos por periodo</p>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={sales.series}>
                <CartesianGrid stroke="rgba(201,162,39,0.15)" />
                <XAxis dataKey="period" stroke="#b8b0a2" tick={{ fontSize: 11 }} />
                <YAxis stroke="#b8b0a2" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#0A1A0F', border: '1px solid #C9A227', color: '#F5F0E8' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Ingresos" stroke="#C9A227" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mb-8 h-72 w-full rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[#152B1A] p-4">
            <p className="mb-2 font-accent text-sm text-[#C9A227]">Pedidos por periodo (origen)</p>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={stackData}>
                <CartesianGrid stroke="rgba(201,162,39,0.15)" />
                <XAxis dataKey="period" stroke="#b8b0a2" tick={{ fontSize: 11 }} />
                <YAxis stroke="#b8b0a2" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#0A1A0F', border: '1px solid #C9A227', color: '#F5F0E8' }}
                />
                <Legend />
                <Bar dataKey="qr" stackId="a" fill={SRC_COLORS.qr} name="QR" />
                <Bar dataKey="crm" stackId="a" fill={SRC_COLORS.crm} name="CRM" />
                <Bar dataKey="staff" stackId="a" fill={SRC_COLORS.staff} name="Staff" />
                <Bar dataKey="admin" stackId="a" fill={SRC_COLORS.admin} name="Admin" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-2 font-heading text-lg text-[#C9A227]">Top productos</h2>
              <div className="overflow-x-auto rounded-xl border border-[rgba(201,162,39,0.2)]">
                <table className="w-full font-accent text-sm">
                  <thead className="bg-[#152B1A] text-left text-[rgba(245,240,232,0.65)]">
                    <tr>
                      <th className="p-2">Producto</th>
                      <th className="p-2">Cant.</th>
                      <th className="p-2">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.map((t) => (
                      <tr key={`${t.item_id}-${t.item_name}`} className="border-t border-[rgba(201,162,39,0.1)]">
                        <td className="p-2">{t.item_name}</td>
                        <td className="p-2">{t.qty}</td>
                        <td className="p-2">${Number(t.revenue).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h2 className="mb-2 font-heading text-lg text-[#C9A227]">Por mesa</h2>
              <div className="overflow-x-auto rounded-xl border border-[rgba(201,162,39,0.2)]">
                <table className="w-full font-accent text-sm">
                  <thead className="bg-[#152B1A] text-left text-[rgba(245,240,232,0.65)]">
                    <tr>
                      <th className="p-2">Mesa</th>
                      <th className="p-2">Pedidos</th>
                      <th className="p-2">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTables.map((t) => (
                      <tr key={String(t.table_number)} className="border-t border-[rgba(201,162,39,0.1)]">
                        <td className="p-2">{t.table_number}</td>
                        <td className="p-2">{t.orders}</td>
                        <td className="p-2">${Number(t.revenue).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

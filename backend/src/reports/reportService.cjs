/** Lógica compartida Express + Vercel (reportes). */

function parseDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  return s
}

function defaultRange() {
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - 6)
  const iso = (d) => d.toISOString().slice(0, 10)
  return { from: iso(from), to: iso(to) }
}

function weekKeyFromDay(dayStr) {
  const [y, m, d] = dayStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const t = new Date(date.getTime())
  const dayNr = (t.getUTCDay() + 6) % 7
  t.setUTCDate(t.getUTCDate() - dayNr + 3)
  const firstThursday = t.getTime()
  t.setUTCMonth(0, 1)
  if (t.getUTCDay() !== 4) {
    t.setUTCDate(1 + ((4 - t.getUTCDay() + 7) % 7))
  }
  const week1 = t.getTime()
  const w = 1 + Math.round((firstThursday - week1) / 604800000)
  return `${t.getUTCFullYear()}-W${String(w).padStart(2, '0')}`
}

function periodKey(dayStr, granularity) {
  if (granularity === 'month') return dayStr.slice(0, 7)
  if (granularity === 'week') return weekKeyFromDay(dayStr)
  return dayStr
}

function mexicoRangeBounds(from, to) {
  return {
    fromIso: `${from}T00:00:00-06:00`,
    toIso: `${to}T23:59:59.999-06:00`,
  }
}

function aggregateTopItemsFromOrders(orders, limit) {
  const agg = new Map()
  for (const o of orders) {
    for (const it of o.items || []) {
      const id = it.id != null ? String(it.id) : ''
      const name = it.name != null ? String(it.name) : ''
      const qty = Number(it.quantity) || 0
      const rev = (Number(it.finalPrice) || 0) * qty
      const k = `${id}|${name}`
      if (!agg.has(k)) {
        agg.set(k, { item_id: id || null, item_name: name || '—', qty: 0, revenue: 0 })
      }
      const row = agg.get(k)
      row.qty += qty
      row.revenue += rev
    }
  }
  return [...agg.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((r) => ({
      ...r,
      revenue: Math.round(Number(r.revenue) * 100) / 100,
    }))
}

async function getSalesReport(supabase, query) {
  const def = defaultRange()
  const from = parseDate(query.from) || def.from
  const to = parseDate(query.to) || def.to
  const source =
    query.source && ['qr', 'crm', 'staff', 'admin'].includes(query.source) ? query.source : null
  const granularity = ['day', 'week', 'month'].includes(query.granularity) ? query.granularity : 'day'

  let q = supabase.from('v_sales_daily').select('*').gte('day', from).lte('day', to)
  if (source) q = q.eq('source', source)
  const { data: dailyRows, error: e1 } = await q
  if (e1) throw e1

  const rows = dailyRows || []
  let totalRevenue = 0
  let totalOrders = 0
  const revenueBySource = { qr: 0, crm: 0, staff: 0, admin: 0 }

  for (const r of rows) {
    const rev = Number(r.revenue) || 0
    const oc = Number(r.orders_count) || 0
    totalRevenue += rev
    totalOrders += oc
    const src = r.source && revenueBySource[r.source] !== undefined ? r.source : 'qr'
    revenueBySource[src] += rev
  }

  const sourcePct = {}
  for (const k of Object.keys(revenueBySource)) {
    sourcePct[k] =
      totalRevenue > 0 ? Math.round((revenueBySource[k] / totalRevenue) * 10000) / 100 : 0
  }

  const seriesMap = new Map()
  const stackMap = new Map()

  for (const r of rows) {
    const p = periodKey(r.day, granularity)
    if (!seriesMap.has(p)) {
      seriesMap.set(p, { period: p, revenue: 0, orders: 0 })
    }
    const s0 = seriesMap.get(p)
    s0.revenue += Number(r.revenue) || 0
    s0.orders += Number(r.orders_count) || 0

    if (!stackMap.has(p)) {
      stackMap.set(p, { period: p, qr: 0, crm: 0, staff: 0, admin: 0 })
    }
    const st = stackMap.get(p)
    const src = r.source && st[r.source] !== undefined ? r.source : 'qr'
    st[src] += Number(r.orders_count) || 0
  }

  const series = [...seriesMap.values()].sort((a, b) => a.period.localeCompare(b.period))
  const seriesBySource = [...stackMap.values()].sort((a, b) => a.period.localeCompare(b.period))

  const { fromIso, toIso } = mexicoRangeBounds(from, to)
  const { data: ordersRows, error: e2 } = await supabase
    .from('orders')
    .select('table_number, total, created_at, source')
    .gte('created_at', fromIso)
    .lte('created_at', toIso)
  if (e2) throw e2

  const list = ordersRows || []
  const filt = source ? list.filter((o) => (o.source ?? 'qr') === source) : list
  const byTable = new Map()
  for (const o of filt) {
    const tn = o.table_number ?? '—'
    if (!byTable.has(tn)) {
      byTable.set(tn, { table_number: tn, orders: 0, revenue: 0 })
    }
    const b = byTable.get(tn)
    b.orders += 1
    b.revenue += Number(o.total) || 0
  }
  const topTables = [...byTable.values()].sort((a, b) => b.revenue - a.revenue)

  return {
    from,
    to,
    granularity,
    source,
    kpis: {
      revenue: Math.round(totalRevenue * 100) / 100,
      orders: totalOrders,
      avgTicket: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
      sourcePct,
    },
    series,
    seriesBySource,
    topTables,
  }
}

async function getTopItemsReport(supabase, query) {
  const def = defaultRange()
  const from = parseDate(query.from) || def.from
  const to = parseDate(query.to) || def.to
  const source =
    query.source && ['qr', 'crm', 'staff', 'admin'].includes(query.source) ? query.source : null
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || '10', 10)))
  const { fromIso, toIso } = mexicoRangeBounds(from, to)

  if (source) {
    const { data: ords, error } = await supabase
      .from('orders')
      .select('items, source')
      .eq('source', source)
      .gte('created_at', fromIso)
      .lte('created_at', toIso)
    if (error) throw error
    const items = aggregateTopItemsFromOrders(ords || [], limit)
    return { from, to, source, items }
  }

  const { data, error } = await supabase
    .from('v_sales_items')
    .select('*')
    .gte('day', from)
    .lte('day', to)
  if (error) throw error

  const agg = new Map()
  for (const r of data || []) {
    const k = `${r.item_id}|${r.item_name}`
    if (!agg.has(k)) {
      agg.set(k, {
        item_id: r.item_id,
        item_name: r.item_name,
        qty: 0,
        revenue: 0,
      })
    }
    const row = agg.get(k)
    row.qty += Number(r.qty) || 0
    row.revenue += Number(r.revenue) || 0
  }

  const items = [...agg.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((r) => ({
      ...r,
      revenue: Math.round(Number(r.revenue) * 100) / 100,
    }))

  return { from, to, source, items }
}

async function getCostsReport(supabase, query) {
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - 29)
  const iso = (d) => d.toISOString().slice(0, 10)
  const defFrom = iso(from)
  const defTo = iso(to)
  const fromQ = parseDate(query.from) || defFrom
  const toQ = parseDate(query.to) || defTo

  const { data, error } = await supabase
    .from('v_sales_costs_daily')
    .select('*')
    .gte('day', fromQ)
    .lte('day', toQ)
    .order('day', { ascending: true })
  if (error) throw error
  const rows = (data || []).map((r) => {
    const rev = Number(r.revenue) || 0
    const cogs = Number(r.cogs) || 0
    const gp = Number(r.gross_profit) || 0
    return {
      day: r.day,
      revenue: rev,
      cogs,
      gross_profit: gp,
      margin_pct: rev > 0 ? Math.round((gp / rev) * 10000) / 100 : null,
    }
  })
  const totals = rows.reduce(
    (a, r) => {
      a.revenue += r.revenue
      a.cogs += r.cogs
      a.gross_profit += r.gross_profit
      return a
    },
    { revenue: 0, cogs: 0, gross_profit: 0 }
  )
  totals.margin_pct =
    totals.revenue > 0 ? Math.round((totals.gross_profit / totals.revenue) * 10000) / 100 : null
  return { from: fromQ, to: toQ, series: rows, totals }
}

async function getMarginsItemsReport(supabase, query) {
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - 29)
  const iso = (d) => d.toISOString().slice(0, 10)
  const fromQ = parseDate(query.from) || iso(from)
  const toQ = parseDate(query.to) || iso(to)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))

  const { data: itemsData, error: e1 } = await supabase
    .from('v_sales_items')
    .select('*')
    .gte('day', fromQ)
    .lte('day', toQ)
  if (e1) throw e1

  const agg = new Map()
  for (const r of itemsData || []) {
    const k = `${r.item_id}|${r.item_name}`
    if (!agg.has(k)) {
      agg.set(k, {
        item_id: r.item_id,
        item_name: r.item_name,
        qty: 0,
        revenue: 0,
      })
    }
    const row = agg.get(k)
    row.qty += Number(r.qty) || 0
    row.revenue += Number(r.revenue) || 0
  }

  const { data: costs, error: e2 } = await supabase.from('menu_items').select('id, estimated_cost')
  if (e2) throw e2
  const costById = new Map((costs || []).map((m) => [String(m.id), m.estimated_cost]))

  const ranked = [...agg.values()]
    .map((r) => {
      const id = r.item_id
      const est = id != null ? costById.get(String(id)) : null
      const cogs = (Number(est) || 0) * (Number(r.qty) || 0)
      const rev = Number(r.revenue) || 0
      const gp = rev - cogs
      return {
        item_id: r.item_id,
        item_name: r.item_name,
        qty: r.qty,
        revenue: Math.round(rev * 100) / 100,
        cogs: Math.round(cogs * 100) / 100,
        gross_profit: Math.round(gp * 100) / 100,
        estimated_cost: est,
      }
    })
    .sort((a, b) => b.gross_profit - a.gross_profit)
    .slice(0, limit)

  return { from: fromQ, to: toQ, items: ranked }
}

async function getMarginsLowReport(supabase, query) {
  const threshold = Math.min(100, Math.max(0, parseFloat(query.threshold ?? '20')))
  const { data, error } = await supabase.from('v_item_margins').select('*')
  if (error) throw error
  const low = (data || []).filter((r) => r.margin_pct != null && Number(r.margin_pct) < threshold)
  low.sort((a, b) => Number(a.margin_pct) - Number(b.margin_pct))
  return { threshold, items: low }
}

module.exports = {
  getSalesReport,
  getTopItemsReport,
  getCostsReport,
  getMarginsItemsReport,
  getMarginsLowReport,
}

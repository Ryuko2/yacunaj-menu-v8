/** @param {string[][]} rows */
export function downloadCsv(filename, headers, rows) {
  const escape = (cell) => {
    const s = cell == null ? '' : String(cell)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))]
  const csv = lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Export raw order rows (ops / legacy admin). */
export function exportOrdersToCSV(orders) {
  const list = Array.isArray(orders) ? orders : []
  const headers = ['order_number', 'table_number', 'total', 'status', 'source', 'created_at']
  const rows = list.map((o) => [
    o.order_number,
    o.table_number,
    o.total,
    o.status,
    o.source ?? 'qr',
    new Date(o.created_at).toLocaleString('es-MX'),
  ])
  downloadCsv(`yacunaj-orders-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
}

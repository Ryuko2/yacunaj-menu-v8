export function SalesStats({ orders }) {
  const today = new Date().toISOString().slice(0, 10)
  const todayOrders = orders.filter(o => o.created_at?.startsWith(today))
  const totalRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0)
  const pending = orders.filter(o => o.status === 'pending').length
  const preparing = orders.filter(o => o.status === 'preparing').length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-sand/50">
        <p className="text-xs text-bark/70 uppercase">Pedidos hoy</p>
        <p className="font-accent text-2xl text-palm">{todayOrders.length}</p>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-sand/50">
        <p className="text-xs text-bark/70 uppercase">Ingresos hoy</p>
        <p className="font-accent text-2xl text-palm">${totalRevenue.toFixed(0)}</p>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-sand/50">
        <p className="text-xs text-bark/70 uppercase">Pendientes</p>
        <p className="font-accent text-2xl text-amber-600">{pending}</p>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-sand/50">
        <p className="text-xs text-bark/70 uppercase">En preparación</p>
        <p className="font-accent text-2xl text-blue-600">{preparing}</p>
      </div>
    </div>
  )
}

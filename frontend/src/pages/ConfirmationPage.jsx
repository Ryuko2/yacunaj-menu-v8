import { Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

export default function ConfirmationPage() {
  const tableNumber = useCartStore(s => s.tableNumber)
  const lastOrderNumber = useCartStore(s => s.lastOrderNumber)

  return (
    <div className="min-h-screen bg-coconut flex flex-col items-center justify-center p-6 max-w-[430px] mx-auto">
      <div className="text-center">
        <span className="text-5xl mb-4 block">🌴</span>
        <h1 className="font-heading text-3xl font-bold text-palm mb-2">
          ¡Tu pedido está en camino!
        </h1>
        <p className="font-accent text-xl text-bark mb-6">
          Pedido #{lastOrderNumber || '---'}
        </p>
        {tableNumber && (
          <p className="text-bark mb-4">Mesa {tableNumber}</p>
        )}
        <p className="text-bark/80 mb-8">
          ✅ Tu orden ha sido recibida.<br />
          El equipo de Yacunaj la preparará pronto.
        </p>
        <Link
          to="/order"
          className="inline-block px-6 py-3 rounded-2xl bg-palm text-coconut font-accent font-bold hover:bg-palm-light transition-colors"
        >
          Ver menú nuevamente
        </Link>
      </div>
    </div>
  )
}

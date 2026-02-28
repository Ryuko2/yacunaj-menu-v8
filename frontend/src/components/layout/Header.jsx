import { useCartStore } from '../../store/cartStore'
import { LeafDecoration } from '../ui/LeafDecoration'

export function Header() {
  const tableNumber = useCartStore(s => s.tableNumber)

  return (
    <header className="relative overflow-hidden rounded-b-3xl bg-coconut/90 backdrop-blur-md shadow-lg">
      <LeafDecoration position="top-left" />
      <LeafDecoration position="top-right" />
      <div className="relative px-6 py-5">
        <h1 className="font-heading text-3xl font-bold text-palm text-center">
          YACUNAJ <span className="text-2xl">🌴</span>
        </h1>
        <p className="text-center text-bark text-sm mt-1 font-accent">
          {tableNumber ? `Mesa #${tableNumber}` : 'Menú'}
        </p>
      </div>
    </header>
  )
}

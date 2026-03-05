import { useCartStore } from '../../store/cartStore'

export function Header() {
  const tableNumber = useCartStore(s => s.tableNumber)

  return (
    <header
      className="relative overflow-hidden rounded-b-3xl shadow-lg"
      style={{
        backgroundImage: "url('/images/coffee_shop_interior.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-mayan/70 backdrop-blur-sm" />
      <img
        src="/images/leaf_1.png"
        alt=""
        className="absolute top-0 left-0 w-20 opacity-40 pointer-events-none"
      />
      <img
        src="/images/leaf_2.png"
        alt=""
        className="absolute top-0 right-0 w-20 opacity-40 pointer-events-none scale-x-[-1]"
      />
      <div className="relative px-6 py-5">
        <h1 className="font-heading text-3xl font-bold text-coconut text-center drop-shadow-md">
          YACUNAJ <span className="text-2xl">🌴</span>
        </h1>
        <p className="text-center text-coconut/90 text-sm mt-1 font-accent drop-shadow">
          {tableNumber ? `Mesa #${tableNumber}` : 'Menú'}
        </p>
      </div>
    </header>
  )
}

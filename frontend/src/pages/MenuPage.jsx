import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { CategoryNav } from '../components/layout/CategoryNav'
import { CartButton } from '../components/layout/CartButton'
import { CartDrawer } from '../components/cart/CartDrawer'
import { MenuSection } from '../components/menu/MenuSection'
import { MenuCard } from '../components/menu/MenuCard'
import { ProductModal } from '../components/menu/ProductModal'
import { useTableValidation } from '../hooks/useTableValidation'
import { menuCategories } from '../data/menu'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export default function MenuPage() {
  const status = useTableValidation()
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]?.id ?? 'food')
  const [cartOpen, setCartOpen] = useState(false)
  const [modalProduct, setModalProduct] = useState(null)
  const [modalCategory, setModalCategory] = useState(null)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coconut">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-coconut p-6">
        <h1 className="font-heading text-2xl text-palm mb-2">Acceso no válido</h1>
        <p className="text-bark text-center">Escanea el código QR de tu mesa para ver el menú.</p>
        <p className="text-sm text-bark/70 mt-4">URL correcta: /order?table=1&token=tok_t1_abc123</p>
      </div>
    )
  }

  const openModal = (item, category) => {
    setModalProduct(item)
    setModalCategory(category)
  }

  return (
    <div
      className="min-h-screen max-w-[430px] mx-auto shadow-2xl relative"
      style={{
        backgroundImage: "url('/images/menu_background.jpg')",
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
      }}
    >
      <div className="min-h-screen bg-coconut/90">
        <Header />

        <div className="px-4 pt-2">
          <div className="w-full h-44 overflow-hidden rounded-2xl mb-4">
            <img
              src="/images/hero_coffee.jpg"
              alt="Yacunaj Café"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/images/hero_coffee.png'
              }}
            />
          </div>

          <CategoryNav activeCategory={activeCategory} onSelect={setActiveCategory} />

          <div className="pb-24">
            {menuCategories.map((cat) => (
              <div key={cat.id} id={`cat-${cat.id}`}>
                <MenuSection title={cat.name} emoji={cat.emoji}>
                  {cat.items.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      category={cat}
                      onClick={openModal}
                    />
                  ))}
                </MenuSection>
              </div>
            ))}
          </div>
        </div>

        <CartButton onClick={() => setCartOpen(true)} />
        <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

        {modalProduct && modalCategory && (
          <ProductModal
            item={modalProduct}
            category={modalCategory}
            onClose={() => { setModalProduct(null); setModalCategory(null) }}
          />
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { MenuHeader } from '../components/layout/MenuHeader'
import { CategoryNav } from '../components/layout/CategoryNav'
import { CartButton } from '../components/layout/CartButton'
import { CartDrawer } from '../components/cart/CartDrawer'
import { MenuSection } from '../components/menu/MenuSection'
import { MenuCard } from '../components/menu/MenuCard'
import { ProductModal } from '../components/menu/ProductModal'
import { FallingLeaves } from '../components/menu/FallingLeaves'
import { useTableValidation } from '../hooks/useTableValidation'
import { menuCategories } from '../data/menu'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export default function MenuPage() {
  const status = useTableValidation()
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]?.id ?? 'food')
  const [cartOpen, setCartOpen] = useState(false)
  const [modalProduct, setModalProduct] = useState(null)
  const [modalCategory, setModalCategory] = useState(null)

  const openModal = (item, category) => {
    setModalProduct(item)
    setModalCategory(category)
  }

  if (status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0A1A0F',
        }}
      >
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div
        style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#0A1A0F', padding: '1.5rem',
        }}
      >
        <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', color: '#C9A227', marginBottom: '0.5rem' }}>
          Acceso no válido
        </h1>
        <p style={{ fontFamily: '"Jost", sans-serif', color: 'rgba(245,240,232,0.7)', textAlign: 'center' }}>
          Escanea el código QR de tu mesa para ver el menú.
        </p>
        <p style={{ fontFamily: '"Jost", sans-serif', fontSize: '0.8rem', color: 'rgba(245,240,232,0.5)', marginTop: '1rem' }}>
          URL correcta: /order?table=1&token=tok_t1_abc123
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh', maxWidth: 430, margin: '0 auto',
        background: 'linear-gradient(180deg, #0A1A0F 0%, #0D2010 50%, #0A1A0F 100%)',
        position: 'relative',
      }}
    >
      <FallingLeaves />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <MenuHeader />

        <div style={{ padding: '0 1rem 6rem' }}>
          <CategoryNav activeCategory={activeCategory} onSelect={setActiveCategory} />

          {menuCategories.map((cat) => (
            <div key={cat.id} id={`cat-${cat.id}`}>
              <MenuSection title={cat.name} categoryId={cat.id}>
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
  )
}

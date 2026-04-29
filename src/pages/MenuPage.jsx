import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MenuHeader } from '../components/layout/MenuHeader'
import { CategoryNav } from '../components/layout/CategoryNav'
import { CartButton } from '../components/layout/CartButton'
import { CartDrawer } from '../components/cart/CartDrawer'
import { MenuSection } from '../components/menu/MenuSection'
import { MenuCard } from '../components/menu/MenuCard'
import { ProductModal } from '../components/menu/ProductModal'
import { FallingLeaves } from '../components/menu/FallingLeaves'
import { useTableValidation } from '../hooks/useTableValidation'
import { useMenuItems } from '../hooks/useMenuItems'
import { menuCategories as staticCategories } from '../data/menu'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export default function MenuPage() {
  const { browseOnly } = useTableValidation()
  const { categories: menuCategories, loading: menuLoading } = useMenuItems()
  const categories = (menuCategories?.length > 0 ? menuCategories : staticCategories)
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? 'food')
  const [cartOpen, setCartOpen] = useState(false)
  const [modalProduct, setModalProduct] = useState(null)
  const [modalCategory, setModalCategory] = useState(null)

  const openModal = (item, category) => {
    setModalProduct(item)
    setModalCategory(category)
  }

  if (menuLoading) {
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

        {browseOnly && (
          <div
            style={{
              margin: '0 1rem 0.75rem',
              padding: '0.6rem 0.75rem',
              borderRadius: 6,
              background: 'rgba(201,162,39,0.12)',
              border: '1px solid rgba(201,162,39,0.28)',
              fontFamily: '"Jost", sans-serif',
              fontSize: '0.72rem',
              lineHeight: 1.4,
              color: 'rgba(245,240,232,0.88)',
            }}
          >
            <strong style={{ color: '#C9A227' }}>Solo consulta.</strong>
            {' '}
            Para armar un pedido desde tu mesa, escanea el QR (te llevará con mesa y código).
            {' '}
            <Link to="/login" style={{ color: '#C9A227', textDecoration: 'underline' }}>Staff</Link>
            {' · '}
            <Link to="/menu" style={{ color: '#C9A227', textDecoration: 'underline' }}>Compartir menú</Link>
          </div>
        )}

        <div style={{ padding: '0 1rem 6rem' }}>
          <CategoryNav categories={categories} activeCategory={activeCategory} onSelect={setActiveCategory} />

          {categories
            .filter((cat) => cat.id === activeCategory)
            .map((cat) => (
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

      <Link
        to="/admin"
        style={{
          position: 'fixed',
          bottom: '0.65rem',
          left: '0.75rem',
          zIndex: 20,
          fontFamily: '"Jost", sans-serif',
          fontSize: '0.7rem',
          color: 'rgba(245,240,232,0.35)',
          textDecoration: 'none',
        }}
      >
        Personal · administración
      </Link>
    </div>
  )
}

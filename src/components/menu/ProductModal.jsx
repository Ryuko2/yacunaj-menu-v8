import { useState } from 'react'
import { useCartStore } from '../../store/cartStore'
import { CategoryIcon } from './CategoryIcon'

export function ProductModal({ item, category, onClose }) {
  const addItem = useCartStore(s => s.addItem)

  const [quantity, setQuantity] = useState(1)
  const [size, setSize] = useState(category?.sizes?.[0])
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [notes, setNotes] = useState('')

  const isVariable = item.price_type === 'variable' || (item.price == null && item.basePrice == null)

  const basePrice = isVariable ? 0 : (item.price ?? item.basePrice ?? 0)
  const sizePrice = size?.price ?? 0
  const effectiveBase = category?.hasSizes && !isVariable ? sizePrice : basePrice

  const maxFree = category?.hasIngredients ? item.maxFreeIngredients ?? 0 : 0
  const extraPrice = item.extraPrice ?? 0
  const extraCount = Math.max(0, selectedIngredients.length - maxFree)
  const ingredientCost = extraCount * extraPrice

  const finalPrice = effectiveBase + ingredientCost
  const canAdd = isVariable || (finalPrice > 0 && !Number.isNaN(finalPrice))

  const toggleIngredient = (ing) => {
    setSelectedIngredients(prev =>
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    )
  }

  const handleAddToCart = () => {
    if (!canAdd) return
    const cartItem = {
      cartId: `${item.id}-${Date.now()}`,
      id: item.id,
      name: item.name,
      size: size?.label || null,
      ingredients: selectedIngredients.length ? selectedIngredients : undefined,
      notes: notes.trim() || undefined,
      quantity,
      finalPrice: isVariable ? 0 : finalPrice,
    }
    addItem(cartItem)
    onClose()
  }

  const modalStyle = {
    position: 'fixed', inset: 0, zIndex: 50,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  }

  const contentStyle = {
    position: 'relative', zIndex: 1,
    background: 'linear-gradient(180deg, #0D2010 0%, #0A1A0F 100%)',
    border: '1px solid rgba(201,162,39,0.2)',
    borderRadius: '8px 8px 0 0',
    width: '100%', maxWidth: '28rem', maxHeight: '90vh',
    overflowY: 'auto',
  }

  return (
    <div style={modalStyle} className="page-enter">
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(5,16,8,0.85)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div style={contentStyle} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '1rem 1.5rem', borderBottom: '1px solid rgba(201,162,39,0.15)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)', borderRadius: '3px',
              color: '#C9A227',
            }}>
              <CategoryIcon category={category?.id} size={18} />
            </div>
            <h2 style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '1.25rem', fontWeight: 600, color: '#F5F0E8',
            }}>{item.name}</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.7)', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {item.image_url && (
            <div style={{
              width: '100%', height: '200px', borderRadius: '6px 6px 0 0',
              overflow: 'hidden', marginBottom: '1rem', margin: '-1.5rem -1.5rem 1rem -1.5rem',
            }}>
              <img
                src={item.image_url}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          )}
          {item.description && (
            <p style={{ fontFamily: '"Jost", sans-serif', fontSize: '0.85rem', color: 'rgba(245,240,232,0.6)', marginBottom: '1.25rem' }}>
              {item.description}
            </p>
          )}

          {category?.hasSizes && category.sizes?.length > 0 && !isVariable && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: '"Jost", sans-serif', fontSize: '0.75rem', fontWeight: 500, color: 'rgba(245,240,232,0.7)', marginBottom: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tamaño</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {category.sizes.map((s) => (
                  <label key={s.id} style={{ flex: 1, cursor: 'pointer' }}>
                    <input type="radio" name="size" checked={size?.id === s.id} onChange={() => setSize(s)} style={{ display: 'none' }} />
                    <div style={{
                      padding: '0.75rem', borderRadius: '4px', textAlign: 'center',
                      border: size?.id === s.id ? '1px solid #C9A227' : '1px solid rgba(201,162,39,0.3)',
                      background: size?.id === s.id ? 'rgba(201,162,39,0.1)' : 'transparent',
                      color: size?.id === s.id ? '#C9A227' : 'rgba(245,240,232,0.7)',
                    }}>
                      <span style={{ display: 'block', fontFamily: '"Jost", sans-serif', fontWeight: 500 }}>{s.label}</span>
                      <span style={{ fontFamily: '"Jost", sans-serif', fontSize: '0.8rem' }}>${s.price}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {category?.hasIngredients && item.ingredients?.length > 0 && !isVariable && (
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: '"Jost", sans-serif', fontSize: '0.75rem', fontWeight: 500, color: 'rgba(245,240,232,0.7)', marginBottom: '0.5rem' }}>
                Ingredientes (primeros {maxFree} incluidos)
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {item.ingredients.map((ing) => (
                  <label key={ing} style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedIngredients.includes(ing)} onChange={() => toggleIngredient(ing)} style={{ display: 'none' }} />
                    <span style={{
                      display: 'inline-block', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem',
                      background: selectedIngredients.includes(ing) ? 'rgba(201,162,39,0.2)' : 'rgba(201,162,39,0.08)',
                      border: `1px solid ${selectedIngredients.includes(ing) ? '#C9A227' : 'rgba(201,162,39,0.2)'}`,
                      color: selectedIngredients.includes(ing) ? '#C9A227' : 'rgba(245,240,232,0.7)',
                    }}>
                      {ing}
                    </span>
                  </label>
                ))}
              </div>
              {extraCount > 0 && (
                <p style={{ fontSize: '0.8rem', color: '#C9A227', marginTop: '0.5rem' }}>
                  +${extraCount * extraPrice} por {extraCount} ingrediente(s) extra
                </p>
              )}
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontFamily: '"Jost", sans-serif', fontSize: '0.75rem', fontWeight: 500, color: 'rgba(245,240,232,0.7)', marginBottom: '0.5rem' }}>
              Preferencias / Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: sin cebolla, extra caliente..."
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '4px',
                background: 'rgba(21,43,26,0.5)', border: '1px solid rgba(201,162,39,0.2)',
                color: '#F5F0E8', resize: 'none', fontFamily: '"Jost", sans-serif', fontSize: '0.85rem',
              }}
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  width: '36px', height: '36px', borderRadius: '4px',
                  background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)',
                  color: '#C9A227', fontSize: '1.2rem', cursor: 'pointer',
                }}
              >
                −
              </button>
              <span style={{ fontFamily: '"Jost", sans-serif', fontSize: '1.1rem', width: '2rem', textAlign: 'center', color: '#F5F0E8' }}>{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{
                  width: '36px', height: '36px', borderRadius: '4px',
                  background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)',
                  color: '#C9A227', fontSize: '1.2rem', cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!canAdd}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: '4px',
                background: canAdd ? 'linear-gradient(135deg, #C9A227, #D4AF37)' : 'rgba(201,162,39,0.2)',
                border: 'none', color: canAdd ? '#0A1A0F' : 'rgba(245,240,232,0.4)',
                fontFamily: '"Jost", sans-serif', fontSize: '0.85rem', fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase', cursor: canAdd ? 'pointer' : 'not-allowed',
              }}
            >
              {canAdd
                ? (isVariable ? `Agregar${quantity > 1 ? ` (${quantity})` : ''}` : `Agregar — $${(finalPrice * quantity).toFixed(0)}`)
                : 'Consultar precio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

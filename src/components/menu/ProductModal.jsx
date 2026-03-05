import { useState } from 'react'
import { useCartStore } from '../../store/cartStore'

export function ProductModal({ item, category, onClose }) {
  const addItem = useCartStore(s => s.addItem)

  const [quantity, setQuantity] = useState(1)
  const [size, setSize] = useState(category?.sizes?.[0])
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [notes, setNotes] = useState('')

  const basePrice = item.price ?? item.basePrice ?? 0
  const sizePrice = size?.price ?? 0
  const effectiveBase = category?.hasSizes ? sizePrice : basePrice

  const maxFree = category?.hasIngredients ? item.maxFreeIngredients ?? 0 : 0
  const extraPrice = item.extraPrice ?? 0
  const extraCount = Math.max(0, selectedIngredients.length - maxFree)
  const ingredientCost = extraCount * extraPrice

  const finalPrice = effectiveBase + ingredientCost

  const toggleIngredient = (ing) => {
    setSelectedIngredients(prev =>
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    )
  }

  const canAdd = finalPrice > 0 && !Number.isNaN(finalPrice)

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
      finalPrice,
    }
    addItem(cartItem)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-coconut w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl">
        <div className="sticky top-0 bg-coconut/95 backdrop-blur py-4 px-6 flex justify-between items-center border-b border-sand">
          <h2 className="font-heading text-xl font-semibold text-palm">{item.name}</h2>
          <button onClick={onClose} className="text-bark text-2xl hover:text-palm">×</button>
        </div>

        <div className="p-6 space-y-5">
          {item.description && (
            <p className="text-bark/80">{item.description}</p>
          )}

          {category?.hasSizes && category.sizes?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-bark mb-2">Tamaño</h3>
              <div className="flex gap-2">
                {category.sizes.map((s) => (
                  <label key={s.id} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="size"
                      checked={size?.id === s.id}
                      onChange={() => setSize(s)}
                      className="sr-only peer"
                    />
                    <div className="p-3 rounded-xl border-2 border-sand text-center peer-checked:border-palm peer-checked:bg-palm/5">
                      <span className="block font-medium text-bark">{s.label}</span>
                      <span className="font-accent text-palm">${s.price}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {category?.hasIngredients && item.ingredients?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-bark mb-2">
                Ingredientes (primeros {maxFree} incluidos)
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.ingredients.map((ing) => (
                  <label key={ing} className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIngredients.includes(ing)}
                      onChange={() => toggleIngredient(ing)}
                      className="sr-only peer"
                    />
                    <span className={`
                      inline-block px-3 py-1.5 rounded-xl text-sm
                      peer-checked:bg-palm peer-checked:text-coconut
                      bg-sand text-bark
                    `}>
                      {ing}
                    </span>
                  </label>
                ))}
              </div>
              {extraCount > 0 && (
                <p className="text-sm text-palm mt-2">
                  +${extraCount * extraPrice} por {extraCount} ingrediente(s) extra
                </p>
              )}
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-bark mb-2">
              📝 Preferencias / Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: sin cebolla, extra caliente, menos hielo, extra dulce..."
              className="w-full rounded-xl border border-sand bg-coconut px-4 py-3 text-sm text-bark placeholder:text-bark/40 focus:outline-none focus:ring-2 focus:ring-palm resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl bg-sand text-bark font-bold text-lg"
              >
                −
              </button>
              <span className="font-accent text-xl w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl bg-sand text-bark font-bold text-lg"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!canAdd}
              className={`px-6 py-3 rounded-2xl font-accent font-bold transition-colors ${
                canAdd ? 'bg-palm text-coconut hover:bg-palm-light' : 'bg-sand text-bark/50 cursor-not-allowed'
              }`}
            >
              {canAdd ? `Agregar — $${(finalPrice * quantity).toFixed(0)}` : 'Consultar precio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

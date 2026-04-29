/**
 * @param {string} itemId
 * @param {{ sizeId?: string, ingredients?: string[], notes?: string }} opts
 */
export function buildCartId(itemId, { sizeId, ingredients = [], notes = '' } = {}) {
  const key = [
    sizeId || '',
    [...ingredients].sort().join(','),
    (notes || '').trim().toLowerCase(),
  ].join('|')
  return `${itemId}-${key}`
}

/** Misma semántica que cartStore.addItem: fusiona por cartId sumando quantity. */
export function mergeCartItems(prevItems, newItem) {
  const idx = prevItems.findIndex((i) => i.cartId === newItem.cartId)
  if (idx === -1) return [...prevItems, newItem]
  return prevItems.map((i, k) =>
    k === idx ? { ...i, quantity: i.quantity + newItem.quantity } : i
  )
}

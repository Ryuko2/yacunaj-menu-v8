import { describe, it } from 'node:test'
import assert from 'node:assert'
import { mergeCartItems, buildCartId } from '../src/lib/cartMerge.js'

describe('cartMerge', () => {
  it('añade ítem nuevo', () => {
    const next = mergeCartItems([], {
      cartId: 'x-k',
      id: 'x',
      name: 'Test',
      quantity: 1,
      finalPrice: 10,
    })
    assert.equal(next.length, 1)
    assert.equal(next[0].quantity, 1)
  })

  it('fusiona mismo cartId sumando quantity', () => {
    const line = { cartId: 'same', id: 'a', name: 'A', quantity: 2, finalPrice: 5 }
    const next = mergeCartItems([line], { ...line, quantity: 3 })
    assert.equal(next.length, 1)
    assert.equal(next[0].quantity, 5)
  })

  it('buildCartId ignora orden de ingredients y normaliza notas', () => {
    const a = buildCartId('latte', {
      sizeId: 'grande',
      ingredients: ['miel', 'vainilla'],
      notes: ' Sin cebolla ',
    })
    const b = buildCartId('latte', {
      sizeId: 'grande',
      ingredients: ['vainilla', 'miel'],
      notes: 'sin cebolla',
    })
    assert.equal(a, b)
  })
})

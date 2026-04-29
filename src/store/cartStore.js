import { create } from 'zustand'
import { mergeCartItems } from '../lib/cartMerge'

export const useCartStore = create((set, get) => ({
  items: [],
  tableNumber: null,
  qrToken: null,
  lastOrderNumber: null,

  setTable: (tableNumber, qrToken) => set({ tableNumber, qrToken }),

  addItem: (item) => set((state) => ({ items: mergeCartItems(state.items, item) })),

  removeItem: (cartId) => set((state) => ({ items: state.items.filter(i => i.cartId !== cartId) })),

  updateQuantity: (cartId, quantity) => set((state) => ({
    items: quantity <= 0
      ? state.items.filter(i => i.cartId !== cartId)
      : state.items.map(i => i.cartId === cartId ? { ...i, quantity } : i)
  })),

  clearCart: () => set({ items: [] }),

  setLastOrderNumber: (orderNumber) => set({ lastOrderNumber: orderNumber }),

  getTotal: () => get().items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0),
  getCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}))

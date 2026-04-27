import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { menuAdminFetch } from './api'

const qk = {
  admin: ['menu', 'admin'],
  categories: ['menu', 'categories'],
  items: (params) => ['menu', 'items', params],
  item: (id) => ['menu', 'item', id],
  modifierGroups: ['menu', 'modifier-groups'],
  modifiers: (groupId) => ['menu', 'modifiers', groupId || 'all'],
}

export function useMenuAdminTree() {
  return useQuery({
    queryKey: qk.admin,
    queryFn: () => menuAdminFetch('/admin'),
    staleTime: 30_000,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: async () => {
      const r = await menuAdminFetch('/categories')
      return r.categories || []
    },
  })
}

export function useMenuItemsAdmin(params = {}) {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.q) qs.set('q', params.q)
  if (params.category_id) qs.set('category_id', params.category_id)
  if (params.active) qs.set('active', params.active)
  const suffix = qs.toString() ? `?${qs}` : ''
  return useQuery({
    queryKey: qk.items(params),
    queryFn: () => menuAdminFetch(`/items${suffix}`),
    staleTime: 30_000,
  })
}

export function useMenuItemDetail(id) {
  return useQuery({
    queryKey: qk.item(id),
    queryFn: () => menuAdminFetch(`/items/${id}`),
    enabled: !!id,
    staleTime: 0,
  })
}

export function useModifierGroups() {
  return useQuery({
    queryKey: qk.modifierGroups,
    queryFn: async () => {
      const r = await menuAdminFetch('/modifier-groups')
      return r.modifier_groups || []
    },
  })
}

export function useModifiers(groupId) {
  return useQuery({
    queryKey: qk.modifiers(groupId),
    queryFn: async () => {
      const q = groupId ? `?group_id=${groupId}` : ''
      const r = await menuAdminFetch(`/modifiers${q}`)
      return r.modifiers || []
    },
  })
}

export function useInvalidateMenuQueries() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['menu'] })
  }
}

export function usePatchCategory() {
  const inv = useInvalidateMenuQueries()
  return useMutation({
    mutationFn: ({ id, patch }) => menuAdminFetch(`/categories/${id}`, { method: 'PATCH', body: patch }),
    onSuccess: () => inv(),
  })
}

export function useReorderCategories() {
  const inv = useInvalidateMenuQueries()
  return useMutation({
    mutationFn: (body) => menuAdminFetch('/categories/reorder', { method: 'PATCH', body }),
    onSuccess: () => inv(),
  })
}

export function usePatchItem() {
  const inv = useInvalidateMenuQueries()
  return useMutation({
    mutationFn: ({ id, patch }) => menuAdminFetch(`/items/${id}`, { method: 'PATCH', body: patch }),
    onSuccess: () => inv(),
  })
}

export function useSetItemPrice() {
  const inv = useInvalidateMenuQueries()
  return useMutation({
    mutationFn: ({ id, price, reason }) =>
      menuAdminFetch(`/items/${id}/price`, { method: 'PATCH', body: { price, reason } }),
    onSuccess: () => inv(),
  })
}

export function useToggleItemStock() {
  const inv = useInvalidateMenuQueries()
  return useMutation({
    mutationFn: ({ id, out_of_stock }) =>
      menuAdminFetch(`/items/${id}/toggle-availability`, { method: 'PATCH', body: { out_of_stock } }),
    onSuccess: () => inv(),
  })
}

export { qk as menuQueryKeys }

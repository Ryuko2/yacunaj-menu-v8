import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchInventory,
  fetchInventoryReorder,
  createInventoryItem,
  updateInventoryItem,
  createMovement,
  fetchSuppliers,
  createSupplier,
  updateSupplier,
} from './api'

export function useInventoryList(params) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => fetchInventory(params),
  })
}

export function useInventoryReorder() {
  return useQuery({
    queryKey: ['inventory', 'reorder'],
    queryFn: fetchInventoryReorder,
  })
}

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  })
}

export function useInventoryMutations() {
  const qc = useQueryClient()
  const createItem = useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
  const updateItem = useMutation({
    mutationFn: ({ id, body }) => updateInventoryItem(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
  const movement = useMutation({
    mutationFn: ({ id, body }) => createMovement(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
  return { createItem, updateItem, movement }
}

export function useSupplierMutations() {
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
  const update = useMutation({
    mutationFn: ({ id, body }) => updateSupplier(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
  return { create, update }
}

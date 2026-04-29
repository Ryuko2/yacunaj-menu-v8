import { useQuery } from '@tanstack/react-query'
import {
  fetchSalesReport,
  fetchTopItems,
  fetchCostsReport,
  fetchMarginsItems,
  fetchMarginsLow,
} from './api'

export function useSalesReport(params) {
  return useQuery({
    queryKey: ['reports', 'sales', params],
    queryFn: () => fetchSalesReport(params),
  })
}

export function useTopItems(params) {
  return useQuery({
    queryKey: ['reports', 'top-items', params],
    queryFn: () => fetchTopItems(params),
  })
}

export function useCostsReport(params) {
  return useQuery({
    queryKey: ['reports', 'costs', params],
    queryFn: () => fetchCostsReport(params),
  })
}

export function useMarginsItems(params) {
  return useQuery({
    queryKey: ['reports', 'margins-items', params],
    queryFn: () => fetchMarginsItems(params),
  })
}

export function useMarginsLow(params) {
  return useQuery({
    queryKey: ['reports', 'margins-low', params],
    queryFn: () => fetchMarginsLow(params),
  })
}

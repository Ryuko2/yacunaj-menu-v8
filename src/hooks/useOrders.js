import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getOrders } from '../lib/api'

function normalizeOrdersPayload (raw) {
  if (Array.isArray(raw)) return raw
  if (raw && Array.isArray(raw.orders)) return raw.orders
  return []
}

export function useOrders(statusFilter) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getOrders(statusFilter)
      setOrders(normalizeOrdersPayload(data))
    } catch (err) {
      console.error(err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    const channel = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  return { orders, loading, refetch: fetchOrders }
}

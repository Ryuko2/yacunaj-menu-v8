import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../store/cartStore'

export function useTableValidation() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | valid | invalid
  const setTable = useCartStore(s => s.setTable)

  useEffect(() => {
    const table = searchParams.get('table')
    const token = searchParams.get('token')
    if (!table || !token) {
      setStatus('invalid')
      return
    }

    supabase
      .from('tables')
      .select('*')
      .eq('table_number', table)
      .eq('qr_token', token)
      .eq('active', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setStatus('invalid')
          return
        }
        setTable(parseInt(table), token)
        setStatus('valid')
      })
  }, [searchParams, setTable])

  return status
}

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

export function useTableValidation() {
  const [status, setStatus] = useState('loading')
  const [searchParams] = useSearchParams()
  const setTable = useCartStore(s => s.setTable)

  useEffect(() => {
    const table = searchParams.get('table')
    const token = searchParams.get('token')

    console.log('[TableValidation] table:', table, 'token:', token)

    if (!table || !token) {
      setStatus('invalid')
      return
    }

    setTable(table, token)
    console.log('[TableValidation] setTable called ✅')
    setStatus('valid')
  }, [searchParams, setTable])

  return status
}

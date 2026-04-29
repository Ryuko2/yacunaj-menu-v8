import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

/**
 * Sincroniza mesa + token del QR con el carrito.
 * Si faltan params → modo consulta (menú público sin QR); el checkout sigue bloqueado en OrderSummary.
 */
export function useTableValidation() {
  const [searchParams] = useSearchParams()
  const setTable = useCartStore((s) => s.setTable)

  const table = searchParams.get('table')
  const token = searchParams.get('token')
  const browseOnly = !(table && token)

  useEffect(() => {
    if (table && token) {
      setTable(table, token)
    } else {
      setTable(null, null)
    }
  }, [table, token, setTable])

  return { browseOnly }
}

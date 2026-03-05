import { useState } from 'react'
import { useCartStore } from '../store/cartStore'

const QUICK_REQUESTS = [
  'Servilletas',
  'Azúcar',
  'Sal y pimienta',
  'Agua',
  'Cubiertos',
  'Cargador de celular',
  'Cuna para bebé',
  'Bolsa para llevar',
  'Otra cosa...',
]

export default function TableActions() {
  const tableNumber = useCartStore((s) => s.tableNumber)
  const qrToken = useCartStore((s) => s.qrToken)
  const items = useCartStore((s) => s.items)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestText, setRequestText] = useState('')
  const [customText, setCustomText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(null)
  const [error, setError] = useState('')

  if (!tableNumber) return null

  const estimatedTotal = items.reduce((sum, item) => sum + (item.finalPrice || 0) * (item.quantity || 1), 0)

  const sendRequest = async (type, message = '') => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          tableNumber,
          qrToken,
          message,
          estimatedTotal: type === 'bill' ? estimatedTotal : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')
      setSent(type)
      setTimeout(() => setSent(null), 4000)
      setShowRequestModal(false)
      setRequestText('')
      setCustomText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = () => {
    const finalMsg = requestText === 'Otra cosa...' ? customText.trim() : requestText
    if (!finalMsg) return
    sendRequest('request', finalMsg)
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 100,
        }}
      >
        <button
          onClick={() => sendRequest('bill')}
          disabled={loading}
          style={{
            background: sent === 'bill' ? '#2D6A4F' : '#C9A227',
            color: sent === 'bill' ? '#fff' : '#0A1A0F',
            border: 'none',
            borderRadius: '24px',
            padding: '10px 18px',
            fontFamily: 'Jost, sans-serif',
            fontWeight: '700',
            fontSize: '13px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {sent === 'bill' ? '✓ Cuenta solicitada' : '🧾 Pedir cuenta'}
        </button>

        <button
          onClick={() => setShowRequestModal(true)}
          disabled={loading}
          style={{
            background: sent === 'request' ? '#2D6A4F' : '#152B1A',
            color: sent === 'request' ? '#fff' : '#F5F0E8',
            border: '1px solid rgba(201,162,39,0.4)',
            borderRadius: '24px',
            padding: '10px 18px',
            fontFamily: 'Jost, sans-serif',
            fontWeight: '600',
            fontSize: '13px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {sent === 'request' ? '✓ Solicitud enviada' : '🙋 Pedir algo'}
        </button>
      </div>

      {showRequestModal && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowRequestModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 200,
            padding: 0,
          }}
        >
          <div
            style={{
              background: '#152B1A',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px 36px',
              width: '100%',
              maxWidth: '480px',
              border: '1px solid rgba(201,162,39,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#C9A227', fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', margin: 0 }}>
                ¿Qué necesitas?
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                style={{ background: 'none', border: 'none', color: '#F5F0E8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {QUICK_REQUESTS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setRequestText(opt)}
                  style={{
                    background: requestText === opt ? '#C9A227' : 'rgba(255,255,255,0.07)',
                    color: requestText === opt ? '#0A1A0F' : '#F5F0E8',
                    border: `1px solid ${requestText === opt ? '#C9A227' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: '20px',
                    padding: '7px 14px',
                    fontFamily: 'Jost, sans-serif',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: requestText === opt ? '700' : '400',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            {requestText === 'Otra cosa...' && (
              <input
                autoFocus
                placeholder="Escribe tu solicitud..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(201,162,39,0.4)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: '#F5F0E8',
                  fontFamily: 'Jost, sans-serif',
                  fontSize: '14px',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            )}

            {error && (
              <p style={{ color: '#ff6b6b', fontSize: '12px', marginBottom: '12px' }}>{error}</p>
            )}

            <button
              onClick={handleRequest}
              disabled={!requestText || (requestText === 'Otra cosa...' && !customText.trim()) || loading}
              style={{
                width: '100%',
                background: (!requestText || loading) ? 'rgba(201,162,39,0.3)' : '#C9A227',
                color: '#0A1A0F',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontFamily: 'Jost, sans-serif',
                fontWeight: '700',
                fontSize: '15px',
                cursor: (!requestText || loading) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Enviando...' : 'Enviar solicitud'}
            </button>

            <p style={{ color: 'rgba(245,240,232,0.4)', fontSize: '11px', textAlign: 'center', marginTop: '12px', marginBottom: 0 }}>
              Mesa {tableNumber} · Tu solicitud llegará al staff de inmediato
            </p>
          </div>
        </div>
      )}
    </>
  )
}

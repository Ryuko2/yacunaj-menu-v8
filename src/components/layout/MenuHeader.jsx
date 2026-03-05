import { useCartStore } from '../../store/cartStore'
import { CategoryIcon } from '../menu/CategoryIcon'

const LEAF_SVG = ({ className, style }) => (
  <svg viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M30 95 C30 95 5 70 5 40 C5 15 17 3 30 3 C43 3 55 15 55 40 C55 70 30 95 30 95Z" fill="currentColor" opacity="0.7" />
    <line x1="30" y1="5" x2="30" y2="95" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <line x1="30" y1="30" x2="15" y2="50" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
    <line x1="30" y1="30" x2="45" y2="50" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
    <line x1="30" y1="50" x2="12" y2="70" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
    <line x1="30" y1="50" x2="48" y2="70" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
  </svg>
)

const LEAF_SMALL = ({ className, style }) => (
  <svg viewBox="0 0 40 70" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M20 65 C20 65 3 48 3 28 C3 10 11 2 20 2 C29 2 37 10 37 28 C37 48 20 65 20 65Z" fill="currentColor" opacity="0.6" />
    <line x1="20" y1="3" x2="20" y2="65" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
  </svg>
)

const LeafIcon = ({ style }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
    <path d="M8 14 C8 14 2 10 2 6 C2 3 4 1 8 1 C12 1 14 3 14 6 C14 10 8 14 8 14Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function MenuHeader() {
  const tableNumber = useCartStore(s => s.tableNumber)

  return (
    <header
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #051008 0%, #0D2010 60%, #0A1A0F 100%)',
        padding: '3rem 1.5rem 2.5rem',
        textAlign: 'center',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(201,162,39,0.2)',
      }}
    >
      {/* Hojas de fondo */}
      <LEAF_SVG
        className="animate-float leaf-delay-1"
        style={{
          position: 'absolute', top: '-10px', left: '-15px',
          width: '90px', height: '140px',
          color: '#1C4A2A', transform: 'rotate(-25deg)',
          pointerEvents: 'none',
        }}
      />
      <LEAF_SVG
        className="animate-float leaf-delay-3"
        style={{
          position: 'absolute', top: '-5px', right: '-20px',
          width: '80px', height: '130px',
          color: '#1C4A2A', transform: 'rotate(30deg) scaleX(-1)',
          pointerEvents: 'none',
        }}
      />
      <LEAF_SMALL
        className="animate-sway leaf-delay-2"
        style={{
          position: 'absolute', bottom: '10px', left: '10px',
          width: '50px', height: '75px',
          color: '#2D6A4F', transform: 'rotate(-15deg)',
          pointerEvents: 'none',
        }}
      />
      <LEAF_SMALL
        className="animate-sway leaf-delay-4"
        style={{
          position: 'absolute', bottom: '15px', right: '15px',
          width: '45px', height: '70px',
          color: '#2D6A4F', transform: 'rotate(20deg) scaleX(-1)',
          pointerEvents: 'none',
        }}
      />

      {/* Resplandor dorado sutil */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '200px', height: '200px',
        background: 'radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Contenido */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '12px', marginBottom: '1rem',
        }}>
          <div style={{ height: '1px', width: '40px', background: 'linear-gradient(to right, transparent, #C9A227)' }} />
          <LeafIcon style={{ width: '16px', color: '#C9A227' }} />
          <div style={{ height: '1px', width: '40px', background: 'linear-gradient(to left, transparent, #C9A227)' }} />
        </div>

        <h1 style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '2.8rem',
          fontWeight: 600,
          letterSpacing: '0.25em',
          color: '#F5F0E8',
          margin: 0,
          lineHeight: 1,
          textTransform: 'uppercase',
        }}>
          YACUNAJ
        </h1>

        <p style={{
          fontFamily: '"Jost", sans-serif',
          fontSize: '0.7rem',
          fontWeight: 300,
          letterSpacing: '0.4em',
          color: '#C9A227',
          margin: '0.5rem 0 1rem',
          textTransform: 'uppercase',
        }}>
          CAFÉ & GELATO
        </p>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 20px',
          border: '1px solid rgba(201,162,39,0.3)',
          borderRadius: '2px',
          background: 'rgba(201,162,39,0.06)',
        }}>
          <span style={{
            fontFamily: '"Jost", sans-serif',
            fontSize: '0.75rem',
            fontWeight: 400,
            letterSpacing: '0.2em',
            color: 'rgba(245,240,232,0.7)',
            textTransform: 'uppercase',
          }}>
            Mesa {tableNumber || '—'}
          </span>
        </div>
      </div>
    </header>
  )
}

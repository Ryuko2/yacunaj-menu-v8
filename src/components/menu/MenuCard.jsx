import { CategoryIcon } from './CategoryIcon'

export function MenuCard({ item, category, onClick }) {
  const isVariable = item.price_type === 'variable' || (item.price == null && item.basePrice == null)
  const price = item.price ?? item.basePrice
  const displayPrice = !isVariable && price != null ? `$${price}` : null

  const cardStyle = {
    background: 'rgba(21, 43, 26, 0.7)',
    border: '1px solid rgba(201,162,39,0.12)',
    borderRadius: '4px',
    padding: '1.25rem 1.25rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    backdropFilter: 'blur(4px)',
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    textAlign: 'left',
  }

  const handleMouseEnter = (e) => {
    e.currentTarget.style.borderColor = 'rgba(201,162,39,0.35)'
    e.currentTarget.style.background = 'rgba(28, 56, 34, 0.8)'
  }
  const handleMouseLeave = (e) => {
    e.currentTarget.style.borderColor = 'rgba(201,162,39,0.12)'
    e.currentTarget.style.background = 'rgba(21, 43, 26, 0.7)'
  }

  return (
    <button
      onClick={() => onClick(item, category)}
      style={cardStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{
        position: 'absolute', left: 0, top: '20%', bottom: '20%',
        width: '2px',
        background: 'linear-gradient(to bottom, transparent, #C9A227, transparent)',
        opacity: 0.5,
      }} />

      <div style={{
        width: '44px', height: '44px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(201,162,39,0.08)',
        border: '1px solid rgba(201,162,39,0.15)',
        borderRadius: '3px',
        color: '#C9A227',
      }}>
        <CategoryIcon category={category?.id} size={22} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '1.05rem',
          fontWeight: 500,
          color: '#F5F0E8',
          margin: 0,
          lineHeight: 1.2,
        }}>
          {item.name}
        </p>
        {item.description && (
          <p style={{
            fontFamily: '"Jost", sans-serif',
            fontSize: '0.72rem',
            fontWeight: 300,
            color: 'rgba(245,240,232,0.5)',
            margin: '3px 0 0',
            letterSpacing: '0.02em',
          }}>
            {item.description}
          </p>
        )}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {isVariable ? (
          <span style={{
            fontFamily: '"Jost", sans-serif',
            fontSize: '0.68rem',
            fontWeight: 500,
            letterSpacing: '0.08em',
            color: '#C9A227',
            background: 'rgba(201,162,39,0.12)',
            border: '1px solid rgba(201,162,39,0.25)',
            padding: '3px 8px',
            borderRadius: '2px',
            textTransform: 'uppercase',
          }}>
            Precio variable
          </span>
        ) : (
          <span style={{
            fontFamily: '"Jost", sans-serif',
            fontSize: '1rem',
            fontWeight: 500,
            color: '#C9A227',
          }}>
            ${price}
          </span>
        )}
      </div>

      <span style={{
        width: '30px', height: '30px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent',
        border: '1px solid rgba(201,162,39,0.4)',
        borderRadius: '2px',
        color: '#C9A227',
        fontSize: '1.2rem',
        fontFamily: '"Jost", sans-serif',
        fontWeight: 300,
        lineHeight: 1,
      }}>
        +
      </span>
    </button>
  )
}

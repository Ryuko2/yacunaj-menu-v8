import { CategoryIcon } from './CategoryIcon'

export function MenuSection({ title, categoryId, children }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid rgba(201,162,39,0.15)',
      }}>
        <div style={{
          width: '32px', height: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#C9A227',
          background: 'rgba(201,162,39,0.08)',
          border: '1px solid rgba(201,162,39,0.2)',
          borderRadius: '2px',
          flexShrink: 0,
        }}>
          <CategoryIcon category={categoryId} size={18} />
        </div>
        <h2 style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '1.4rem',
          fontWeight: 600,
          color: '#F5F0E8',
          margin: 0,
          letterSpacing: '0.05em',
        }}>
          {title}
        </h2>
      </div>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {children}
      </div>
    </section>
  )
}

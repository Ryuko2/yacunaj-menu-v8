import { menuCategories } from '../../data/menu'
import { CategoryIcon } from '../menu/CategoryIcon'

export function CategoryNav({ activeCategory, onSelect }) {
  return (
    <nav
      className="flex gap-2 overflow-x-auto py-4 px-4 -mx-4 scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {menuCategories.map((cat) => {
        const isActive = activeCategory === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: isActive ? 'rgba(201,162,39,0.15)' : 'transparent',
              border: `1px solid ${isActive ? '#C9A227' : 'rgba(201,162,39,0.2)'}`,
              borderRadius: '2px',
              color: isActive ? '#C9A227' : 'rgba(245,240,232,0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              fontFamily: '"Jost", sans-serif',
              fontSize: '0.75rem',
              fontWeight: isActive ? 500 : 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            <CategoryIcon category={cat.id} size={14} />
            {cat.name}
          </button>
        )
      })}
    </nav>
  )
}

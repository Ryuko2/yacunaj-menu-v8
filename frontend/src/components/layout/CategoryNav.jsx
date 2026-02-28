import { menuCategories } from '../../data/menu'

export function CategoryNav({ activeCategory, onSelect }) {
  return (
    <nav className="flex gap-2 overflow-x-auto py-4 px-4 -mx-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {menuCategories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`
            flex-shrink-0 px-4 py-2 rounded-2xl font-medium text-sm transition-all
            ${activeCategory === cat.id
              ? 'bg-palm text-coconut shadow-lg'
              : 'bg-sand text-bark hover:bg-sunset-light/30'
            }
          `}
        >
          <span className="mr-1">{cat.emoji}</span> {cat.name}
        </button>
      ))}
    </nav>
  )
}

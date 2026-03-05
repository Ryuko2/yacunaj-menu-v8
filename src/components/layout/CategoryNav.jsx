import { menuCategories } from '../../data/menu'

const categoryImages = {
  food: '/images/food_category.png',
  snacks: '/images/food_category.png',
  postres: '/images/desserts.png',
  cafes: '/images/coffee_category.png',
  cappuccinos: '/images/coffee_category.png',
  lattes: '/images/coffee_category.png',
  smoothies: '/images/cold_drinks.png',
  sodas: '/images/cold_drinks.png',
  tisanas: '/images/cold_drinks.png',
  frappe: '/images/cold_drinks.png',
  'otras-bebidas': '/images/cold_drinks.png',
}

export function CategoryNav({ activeCategory, onSelect }) {
  return (
    <nav className="flex gap-2 overflow-x-auto py-4 px-4 -mx-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {menuCategories.map((cat) => {
        const imgSrc = categoryImages[cat.id]
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-2xl font-medium text-sm transition-all flex items-center gap-1.5
              ${activeCategory === cat.id
                ? 'bg-palm text-coconut shadow-lg'
                : 'bg-sand text-bark hover:bg-sunset-light/30'
              }
            `}
          >
            {imgSrc ? (
              <>
                <img src={imgSrc} alt="" className="w-5 h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.remove('hidden') }} />
                <span className="hidden">{cat.emoji}</span>
              </>
            ) : (
              <span>{cat.emoji}</span>
            )}
            {cat.name}
          </button>
        )
      })}
    </nav>
  )
}

const ITEM_IMAGES = {
  afogato: '/images/afogato.jpg',
}

export function MenuCard({ item, category, onClick }) {
  const price = item.price ?? item.basePrice
  const displayPrice = price != null ? `$${price}` : 'Precio variable'
  const imageSrc = ITEM_IMAGES[item.id]

  return (
    <button
      onClick={() => onClick(item, category)}
      className="w-full text-left p-4 rounded-2xl bg-white shadow-md hover:shadow-lg hover:shadow-bark/10 transition-all border border-sand/50"
    >
      <div className="flex gap-3">
        {imageSrc && (
          <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-sand">
            <img
              src={imageSrc}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.parentElement.style.display = 'none' }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-medium text-bark">{item.name}</h3>
            <span className="font-accent font-bold text-palm flex-shrink-0">
              {displayPrice}
            </span>
          </div>
          {item.description && (
            <p className="text-sm text-bark/80 mt-0.5">{item.description}</p>
          )}
        </div>
      </div>
    </button>
  )
}

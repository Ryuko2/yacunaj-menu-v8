export function LeafDecoration({ position = 'top-right', className = '' }) {
  const positions = {
    'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
    'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
    'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
  }
  return (
    <div className={`absolute pointer-events-none opacity-30 ${positions[position]} ${className}`}>
      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" className="text-palm">
        <path d="M50 5 C30 30 20 60 50 95 C80 60 70 30 50 5" fill="currentColor" opacity="0.6" />
      </svg>
    </div>
  )
}

export function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' }
  return (
    <div className={`animate-spin rounded-full border-2 border-sand border-t-palm ${sizes[size]}`} />
  )
}

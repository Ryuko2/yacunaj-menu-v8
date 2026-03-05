export function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 24, md: 40, lg: 64 }
  const px = sizes[size]
  return (
    <div
      style={{
        width: px, height: px, borderRadius: '50%',
        border: '2px solid rgba(201,162,39,0.2)',
        borderTopColor: '#C9A227',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  )
}

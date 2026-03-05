import { useState, useEffect } from 'react'

const LeafSVG = () => (
  <svg viewBox="0 0 30 50" fill="none" width="30" height="50">
    <path d="M15 47 C15 47 2 35 2 20 C2 8 8 2 15 2 C22 2 28 8 28 20 C28 35 15 47 15 47Z" fill="rgba(45,106,79,0.5)" />
    <line x1="15" y1="3" x2="15" y2="47" stroke="rgba(45,106,79,0.6)" strokeWidth="0.8" />
  </svg>
)

export function FallingLeaves() {
  const [leaves, setLeaves] = useState([])

  useEffect(() => {
    const createLeaf = () => ({
      id: Math.random(),
      left: Math.random() * 100,
      duration: 8 + Math.random() * 6,
      delay: Math.random() * 4,
      size: 0.5 + Math.random() * 0.8,
    })

    setLeaves([...Array(6)].map(createLeaf))

    const interval = setInterval(() => {
      setLeaves(prev => [...prev.slice(-8), createLeaf()])
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {leaves.map(leaf => (
        <div
          key={leaf.id}
          style={{
            position: 'absolute',
            left: `${leaf.left}%`,
            top: '-60px',
            transform: `scale(${leaf.size})`,
            animation: `leafDrift ${leaf.duration}s ${leaf.delay}s linear forwards`,
            opacity: 0,
          }}
        >
          <LeafSVG />
        </div>
      ))}
    </div>
  )
}

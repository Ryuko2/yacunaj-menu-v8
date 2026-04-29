import { useEffect, useRef } from 'react'

const SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function listFocusable(container) {
  return Array.from(container.querySelectorAll(SELECTOR)).filter(
    (el) => el.offsetParent !== null || document.activeElement === el
  )
}

/**
 * @param {boolean} active
 * @param {React.RefObject<HTMLElement | null>} containerRef
 * @param {{ restoreFocusRef?: React.RefObject<HTMLElement | null> }} [opts]
 */
export function useFocusTrap(active, containerRef, opts = {}) {
  const { restoreFocusRef } = opts
  const lastActiveRef = useRef(null)

  useEffect(() => {
    if (!active || !containerRef?.current) return

    lastActiveRef.current = document.activeElement
    const root = containerRef.current
    const focusables = listFocusable(root)
    if (focusables.length > 0) focusables[0].focus()

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return
      const nodes = listFocusable(root)
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      const restoreTo = restoreFocusRef?.current || lastActiveRef.current
      if (restoreTo && typeof restoreTo.focus === 'function') {
        restoreTo.focus()
      }
    }
  }, [active, containerRef, restoreFocusRef])
}

import { useCallback, useMemo, useRef, useState } from 'react'

/**
 * Lets a floating panel be repositioned by dragging a handle inside it
 * (never the panel body itself, so scrolling lists and buttons keep working
 * normally). Position is an offset from the panel's own CSS position, is
 * session-only — it resets on reload — and snaps back on release if the
 * drag left it mostly off-screen.
 */
export function useDraggable() {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const panelRef = useRef<HTMLElement | null>(null)
  const drag = useRef<{ id: number; startX: number; startY: number; originX: number; originY: number } | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.preventDefault()
    drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [offset])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    setOffset({ x: d.originX + (e.clientX - d.startX), y: d.originY + (e.clientY - d.startY) })
  }, [])

  const endDrag = useCallback(() => {
    drag.current = null
    const el = panelRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const margin = 12
    setOffset((o) => {
      let dx = 0
      let dy = 0
      if (r.left < margin) dx = margin - r.left
      if (r.right > window.innerWidth - margin) dx = Math.min(dx, window.innerWidth - margin - r.right)
      if (r.top < margin) dy = margin - r.top
      if (r.bottom > window.innerHeight - margin) dy = Math.min(dy, window.innerHeight - margin - r.bottom)
      return dx || dy ? { x: o.x + dx, y: o.y + dy } : o
    })
  }, [])

  // Exposed as custom properties, not `transform` directly: several panels
  // already need their own transform (centering, the open/close scale) in
  // CSS, and a plain inline `transform` here would silently replace it
  // instead of composing with it. Each panel's stylesheet rule ends its
  // transform chain with `translate(var(--drag-x, 0px), var(--drag-y, 0px))`.
  const style = useMemo(
    () =>
      ({
        '--drag-x': `${offset.x}px`,
        '--drag-y': `${offset.y}px`,
      }) as React.CSSProperties,
    [offset.x, offset.y],
  )

  const handleProps = { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag }

  return { panelRef, style, handleProps, reset: () => setOffset({ x: 0, y: 0 }) }
}

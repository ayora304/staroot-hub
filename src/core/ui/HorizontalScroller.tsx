import { useEffect, useRef, useState, type ReactNode } from 'react'
import './horizontal-scroller.css'

export function HorizontalScroller({ children, label, className = '', role }: { children: ReactNode; label: string; className?: string; role?: 'tablist' }) {
  const viewport = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState(1)
  const [active, setActive] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ pointerId: number; startX: number; scrollLeft: number; moved: boolean } | null>(null)
  useEffect(() => {
    const element = viewport.current
    if (!element) return
    function update() {
      if (!element) return
      if (element.clientWidth <= 0) { setPages(1); setActive(0); return }
      const count = Math.max(1, Math.ceil((element.scrollWidth - 1) / element.clientWidth))
      setPages(count)
      const maximum = element.scrollWidth - element.clientWidth
      setActive(maximum > 0 ? Math.round(element.scrollLeft / maximum * (count - 1)) : 0)
    }
    const observer = new ResizeObserver(update)
    observer.observe(element)
    for (const child of element.children) observer.observe(child)
    element.addEventListener('scroll', update, { passive: true })
    update()
    return () => { observer.disconnect(); element.removeEventListener('scroll', update) }
  }, [children])
  return <div className="horizontal-scroller">
    <div ref={viewport} role={role} aria-label={label} className={`horizontal-scroller__viewport ${dragging ? 'is-dragging' : ''} ${className}`}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return
        drag.current = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: event.currentTarget.scrollLeft, moved: false }
      }}
      onPointerMove={(event) => {
        const current = drag.current
        if (!current || current.pointerId !== event.pointerId || event.buttons !== 1) return
        const distance = event.clientX - current.startX
        if (!current.moved && Math.abs(distance) < 6) return
        if (!current.moved) {
          current.moved = true
          event.currentTarget.setPointerCapture(event.pointerId)
          setDragging(true)
        }
        event.preventDefault()
        event.currentTarget.scrollLeft = current.scrollLeft - distance
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        setDragging(false)
      }}
      onPointerCancel={() => { drag.current = null; setDragging(false) }}
      onLostPointerCapture={() => setDragging(false)}
      onClickCapture={(event) => {
        if (drag.current?.moved && event.detail > 0) { event.preventDefault(); event.stopPropagation() }
      }}
    >{children}</div>
    {pages > 1 && <div className="horizontal-scroller__dots" role="group" aria-label={`${label} pages`}>{Array.from({ length: pages }, (_, index) => <button type="button" key={index} aria-label={`Show ${label.toLowerCase()} page ${index + 1} of ${pages}`} aria-current={active === index ? 'true' : undefined} onClick={() => {
      const element = viewport.current
      if (element) element.scrollTo({ left: (element.scrollWidth - element.clientWidth) * index / (pages - 1), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    }}><span /></button>)}</div>}
  </div>
}

import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'framer-motion'
import type { MotionStyle } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ComponentType, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode, SVGProps } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export type RadialHubIcon = ComponentType<SVGProps<SVGSVGElement>>

export type RadialHubItem = {
  id: string
  label: string
  to: string
  icon: RadialHubIcon
  description: string
  badge?: number | string
}

type Point = { x: number; y: number }
const CX = 268
const CY = 230
const INNER_RADIUS = 82
const OUTER_RADIUS = 180
const SLOT_ANGLE = 45
const SLOT_ZERO_ANGLE = -112.5
const MAX_ITEMS = 8

function polar(radius: number, angle: number): Point {
  const radians = (angle * Math.PI) / 180
  return { x: CX + radius * Math.cos(radians), y: CY + radius * Math.sin(radians) }
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function nearestItemAtActiveSlot(position: number, itemCount: number) {
  return modulo(Math.round(position + 1), itemCount)
}

/** Create one rounded annular wedge path. Angles use SVG coordinates. */
export function describeSector(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number,
  gapDeg: number,
  cornerRadius: number,
): string {
  const start = startAngle + gapDeg / 2
  const end = endAngle - gapDeg / 2
  const sweep = end - start
  const largeArc = sweep > 180 ? 1 : 0
  const radius = Math.max(0, Math.min(cornerRadius, (rOuter - rInner) / 2))
  const outerInset = (radius / Math.max(rOuter, 1) * 180) / Math.PI
  const innerInset = (radius / Math.max(rInner, 1) * 180) / Math.PI
  const pointAt = (r: number, a: number) => {
    const radians = (a * Math.PI) / 180
    return { x: cx + r * Math.cos(radians), y: cy + r * Math.sin(radians) }
  }
  const outerStart = pointAt(rOuter, start + outerInset)
  const outerEnd = pointAt(rOuter, end - outerInset)
  const innerEnd = pointAt(rInner, end - innerInset)
  const innerStart = pointAt(rInner, start + innerInset)
  const endCorner = pointAt((rInner + rOuter) / 2, end)
  const startCorner = pointAt((rInner + rOuter) / 2, start)
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `Q ${endCorner.x} ${endCorner.y} ${innerEnd.x} ${innerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    `Q ${startCorner.x} ${startCorner.y} ${outerStart.x} ${outerStart.y}`,
    'Z',
  ].join(' ')
}

function SlotItem({
  item,
  index,
  itemCount,
  pos,
  activeIndex,
  optionRef,
  sectorPath,
  onSelect,
  onNavigate,
}: {
  item: RadialHubItem
  index: number
  itemCount: number
  pos: ReturnType<typeof useMotionValue<number>>
  activeIndex: number
  optionRef: (node: SVGGElement | null) => void
  sectorPath: string
  onSelect: (index: number) => void
  onNavigate: (to: string) => void
}) {
  const slot = useTransform(pos, (value) => modulo(index - value + 0.5, itemCount) - 0.5)
  const angle = useTransform(slot, (value) => SLOT_ZERO_ANGLE + SLOT_ANGLE * value)
  const rotation = useTransform(slot, (value) => SLOT_ANGLE * value)
  const activeProgress = useTransform(slot, (value) => {
    const proximity = Math.max(0, Math.min(1, 1 - Math.abs(value - 1)))
    return smoothstep(0, 1, proximity)
  })
  const activeProgressPercent = useTransform(activeProgress, (value) => `${value * 100}%`)
  const pointerEvents = useTransform(slot, (value) => {
    const lastSlot = itemCount - 1
    const visibleOpacity = value < 0
      ? Math.max(0, Math.min(1, 1 + value / 0.5))
      : value > lastSlot - 0.5
        ? Math.max(0, Math.min(1, (lastSlot + 0.5 - value) / 0.5))
        : 1
    return visibleOpacity < 0.3 ? 'none' : 'auto'
  })
  const popX = useTransform(slot, (value) => {
    const theta = (SLOT_ZERO_ANGLE + SLOT_ANGLE * value) * Math.PI / 180
    const progress = smoothstep(0, 1, Math.max(0, Math.min(1, 1 - Math.abs(value - 1))))
    return Math.cos(theta) * progress * 16
  })
  const popY = useTransform(slot, (value) => {
    const theta = (SLOT_ZERO_ANGLE + SLOT_ANGLE * value) * Math.PI / 180
    const progress = smoothstep(0, 1, Math.max(0, Math.min(1, 1 - Math.abs(value - 1))))
    return Math.sin(theta) * progress * 16
  })
  const opacity = useTransform(slot, (value) => {
    const lastSlot = itemCount - 1
    if (value < 0) return Math.max(0, Math.min(1, 1 + value / 0.5))
    if (value > lastSlot - 0.5) return Math.max(0, Math.min(1, (lastSlot + 0.5 - value) / 0.5))
    return 1
  })
  const iconX = useTransform(angle, (value) => polar((INNER_RADIUS + OUTER_RADIUS) / 2, value).x)
  const iconY = useTransform(angle, (value) => polar((INNER_RADIUS + OUTER_RADIUS) / 2, value).y)
  const badgeX = useTransform(angle, (value) => polar(OUTER_RADIUS - 12, value + SLOT_ANGLE * 0.27).x)
  const badgeY = useTransform(angle, (value) => polar(OUTER_RADIUS - 12, value + SLOT_ANGLE * 0.27).y)
  const Icon = item.icon
  const active = activeIndex === index
  const hasBadge = typeof item.badge === 'number' ? item.badge > 0 : Boolean(item.badge)

  return (
    <motion.g
      ref={optionRef}
      className="radial-hub__option"
      role="button"
      aria-label={item.label}
      aria-pressed={active}
      tabIndex={active ? 0 : -1}
      id={`radial-hub-option-${item.id}`}
      data-item-index={index}
      style={{ opacity, pointerEvents, '--active-progress': activeProgressPercent } as MotionStyle}
      onClick={() => active ? onNavigate(item.to) : onSelect(index)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          active ? onNavigate(item.to) : onSelect(index)
        }
      }}
    >
      <motion.g className="radial-hub__pop" style={{ x: popX, y: popY }}>
        <motion.path
          className="radial-hub__sector"
          d={sectorPath}
          strokeLinejoin="round"
          style={{
            rotate: rotation,
            transformBox: 'view-box',
            transformOrigin: `${CX}px ${CY}px`,
          } as MotionStyle}
        />
        <motion.g className="radial-hub__icon" style={{ x: iconX, y: iconY, opacity }} aria-hidden="true">
          <foreignObject x={-16} y={-16} width="32" height="32" overflow="visible">
            <Icon xmlns="http://www.w3.org/2000/svg" width="30" height="30" strokeWidth={1.75} />
          </foreignObject>
        </motion.g>
        {hasBadge && (
          <motion.g className="radial-hub__badge" style={{ x: badgeX, y: badgeY, opacity }} aria-hidden="true">
            <circle r="12" />
            <text y="4" textAnchor="middle">{item.badge}</text>
          </motion.g>
        )}
      </motion.g>
    </motion.g>
  )
}

export function RadialHub({ items, centerSlot }: { items: RadialHubItem[]; centerSlot?: ReactNode }) {
  const navigate = useNavigate()
  const reduceMotion = Boolean(useReducedMotion())
  const initialIndex = 0
  const initialPos = initialIndex - 1
  const pos = useMotionValue(initialPos)
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const activeIndexRef = useRef(initialIndex)
  const optionRefs = useRef<Array<SVGGElement | null>>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const wheelRef = useRef<SVGGElement>(null)
  const dragRef = useRef<{ pointerId: number; angle: number; startX: number; startY: number; lastTime: number; velocity: number; dragged: boolean } | null>(null)
  const suppressClickRef = useRef(false)
  const sectorPath = describeSector(CX, CY, INNER_RADIUS + 9, OUTER_RADIUS - 9, -135, -90, 22 / OUTER_RADIUS * 180 / Math.PI, 9)

  const setSettledActive = useCallback((next: number) => {
    const normalized = modulo(next, items.length)
    if (normalized === activeIndexRef.current) return
    activeIndexRef.current = normalized
    setActiveIndex(normalized)
  }, [items.length])

  const snapTo = useCallback((target: number) => {
    if (reduceMotion) {
      pos.set(target)
      setSettledActive(nearestItemAtActiveSlot(target, items.length))
      return
    }
    void animate(pos, target, { type: 'spring', stiffness: 250, damping: 28, mass: 0.8 }).then(() => {
      setSettledActive(nearestItemAtActiveSlot(pos.get(), items.length))
    })
  }, [pos, reduceMotion, setSettledActive])

  useEffect(() => {
    if (reduceMotion) {
      pos.set(initialPos)
      return
    }
    pos.set(initialPos - 2.2)
    const controls = animate(pos, initialPos, { type: 'spring', stiffness: 90, damping: 22, mass: 1.1 })
    return () => controls.stop()
  }, [items.length, initialPos, pos, reduceMotion])

  useMotionValueEvent(pos, 'change', (value) => {
    const rounded = nearestItemAtActiveSlot(value, items.length)
    if (rounded !== activeIndexRef.current) setSettledActive(rounded)
  })

  const pointInSvg = (event: ReactPointerEvent<SVGSVGElement>) => {
    const wheel = wheelRef.current
    const svg = svgRef.current
    const matrix = wheel?.getScreenCTM()
    if (!wheel || !svg || !matrix) return null
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const local = point.matrixTransform(matrix.inverse())
    return { x: local.x, y: local.y }
  }

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = pointInSvg(event)
    if (!point || Math.hypot(point.x - CX, point.y - CY) < 24) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      angle: Math.atan2(point.y - CY, point.x - CX) * 180 / Math.PI,
      startX: event.clientX,
      startY: event.clientY,
      lastTime: performance.now(),
      velocity: 0,
      dragged: false,
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    const point = pointInSvg(event)
    if (!drag || drag.pointerId !== event.pointerId || !point || Math.hypot(point.x - CX, point.y - CY) < 24) return
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY)
    if (distance < 6 && !drag.dragged) return
    drag.dragged = true
    let nextAngle = Math.atan2(point.y - CY, point.x - CX) * 180 / Math.PI
    let delta = nextAngle - drag.angle
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    const deltaPos = -delta / SLOT_ANGLE
    pos.set(pos.get() + deltaPos)
    const now = performance.now()
    drag.velocity = deltaPos / Math.max(1, now - drag.lastTime)
    drag.lastTime = now
    drag.angle = nextAngle
  }

  const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    if (!drag.dragged) return
    suppressClickRef.current = true
    window.setTimeout(() => { suppressClickRef.current = false }, 0)
    const momentum = Math.max(-2, Math.min(2, drag.velocity * 140))
    snapTo(Math.round(pos.get() + momentum))
  }

  const rollTo = useCallback((index: number, focus = false) => {
    const current = pos.get()
    const baseTarget = index - 1
      const target = baseTarget + Math.round((current - baseTarget) / items.length) * items.length
    snapTo(target)
    if (focus) window.requestAnimationFrame(() => optionRefs.current[index]?.focus())
  }, [items.length, pos, snapTo])

  const handleKeyDown = (event: ReactKeyboardEvent<SVGSVGElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      rollTo(modulo(activeIndex + 1, items.length), true)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      rollTo(modulo(activeIndex - 1, items.length), true)
    } else if (event.key === 'Home') {
      event.preventDefault()
      rollTo(0, true)
    } else if (event.key === 'End') {
      event.preventDefault()
      rollTo(items.length - 1, true)
    }
  }

  if (items.length === 0 || items.length > MAX_ITEMS) {
    throw new Error(`RadialHub requires between 1 and ${MAX_ITEMS} items.`)
  }
  const activeItem = items[activeIndex]
  if (!activeItem) return null

  return (
    <section className="radial-hub mx-auto w-full max-w-[560px]" aria-label="Staroot Hub sections">
      <div className="radial-hub__frame">
        <svg
          ref={svgRef}
          className="radial-hub__svg block w-full"
          viewBox="0 0 560 460"
          role="group"
          aria-label="Staroot Hub sections"
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <g ref={wheelRef} className="radial-hub__wheel" transform={`translate(-39 0) translate(${CX} ${CY}) scale(1.44) translate(${-CX} ${-CY})`}>
            {items.map((item, index) => (
              <SlotItem
                key={item.id}
                item={item}
                index={index}
                itemCount={items.length}
                pos={pos}
                activeIndex={activeIndex}
                optionRef={(node) => { optionRefs.current[index] = node }}
                sectorPath={sectorPath}
                onSelect={(selectedIndex) => {
                  if (!suppressClickRef.current) rollTo(selectedIndex, true)
                }}
                onNavigate={(to) => { if (!suppressClickRef.current) navigate(to) }}
              />
            ))}
            {centerSlot && (
              <foreignObject x={CX - INNER_RADIUS + 8} y={CY - 34} width={(INNER_RADIUS - 8) * 2} height="68" className="radial-hub__center-slot">
                <div className="radial-hub__center-content">{centerSlot}</div>
              </foreignObject>
            )}
          </g>
          <foreignObject x="18" y="145" width="240" height="190" className="radial-hub__active-panel">
            <div className="radial-hub__active-inner" aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeItem.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  className="radial-hub__active-copy"
                >
                  <p className="radial-hub__eyebrow">Module {activeIndex + 1} of {items.length}</p>
                  <h2>{activeItem.label}</h2>
                  <p className="radial-hub__description">{activeItem.description}</p>
                  <button type="button" className="radial-hub__open" onClick={() => navigate(activeItem.to)}>
                    <span>Open</span><ArrowRight aria-hidden="true" size={15} />
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          </foreignObject>
        </svg>
      </div>
      <div className="radial-hub__controls" aria-label="Module controls">
        <button type="button" aria-label="Previous module" onClick={() => rollTo(modulo(activeIndex - 1, items.length), true)}><ChevronLeft aria-hidden="true" /></button>
        <p>Drag around the ring, or tap a segment</p>
        <button type="button" aria-label="Next module" onClick={() => rollTo(modulo(activeIndex + 1, items.length), true)}><ChevronRight aria-hidden="true" /></button>
      </div>
      <style>{`
        .radial-hub { color: var(--c-text); }
        .radial-hub { --rh-base: #0F6E56; --rh-gold: #E8B02E; --rh-gold-ink: #412402; --rh-badge: #E24B4A; }
        .radial-hub__frame { width: 100%; }
        .radial-hub__svg { overflow: visible; touch-action: none; }
        .radial-hub__option { cursor: pointer; outline: none; }
        .radial-hub__sector { fill: color-mix(in srgb, var(--rh-gold) var(--active-progress, 0%), var(--rh-base)); stroke: color-mix(in srgb, var(--rh-gold) var(--active-progress, 0%), var(--rh-base)); stroke-width: 18px; stroke-linejoin: round; transition: filter 150ms ease; }
        .radial-hub__option:hover .radial-hub__sector { filter: brightness(1.12); }
        .radial-hub__option:focus-visible .radial-hub__sector { stroke: var(--c-text); stroke-width: 4; }
        .radial-hub__icon { color: color-mix(in srgb, var(--rh-gold-ink) var(--active-progress, 0%), #fff); pointer-events: none; }
        .radial-hub__wheel { transform-box: view-box; }
        .radial-hub__badge circle { fill: var(--rh-badge); stroke: var(--c-bg); stroke-width: 2; }
        .radial-hub__badge text { fill: #fff; font: 500 11px var(--font-sans); }
        .radial-hub__active-inner { width: 240px; height: 190px; display: flex; align-items: center; font-family: var(--font-sans); }
        .radial-hub__active-copy { width: 100%; }
        .radial-hub__eyebrow { margin: 0 0 6px; color: var(--rh-gold); font-size: 12px; font-weight: 500; }
        .radial-hub__active-copy h2 { margin: 0 0 7px; color: var(--c-text); font-size: 28px; font-weight: 500; line-height: 1.1; overflow-wrap: anywhere; }
        .radial-hub__description { margin: 0 0 12px; color: var(--c-muted); font-size: 14px; line-height: 1.5; }
        .radial-hub__open { min-height: 44px; max-width: 100%; display: inline-flex; align-items: center; gap: 6px; border: 1px solid color-mix(in srgb, var(--rh-gold) 55%, var(--c-border)); border-radius: 10px; padding: 0 14px; background: transparent; color: var(--c-text); font: 600 13px var(--font-sans); cursor: pointer; }
        .radial-hub__open:hover, .radial-hub__open:focus-visible { background: var(--rh-gold); border-color: var(--rh-gold); color: var(--rh-gold-ink); }
        .radial-hub__open:focus-visible, .radial-hub__controls button:focus-visible { outline: 3px solid var(--rh-gold); outline-offset: 2px; }
        .radial-hub__center-content { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; text-align: center; }
        .radial-hub__controls { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 4px 8px 0; }
        .radial-hub__controls button { width: 56px; height: 56px; flex: 0 0 56px; display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid var(--c-border); border-radius: 14px; padding: 0; background: transparent; color: var(--c-text); cursor: pointer; }
        .radial-hub__controls button svg { width: 22px; height: 22px; stroke-width: 1.7; }
        .radial-hub__controls p { flex: 1; margin: 0; color: var(--c-muted); text-align: center; font-size: 14px; line-height: 1.35; }
        @media (min-width: 600px) { .radial-hub__wheel { transform: translate(16px, 0) translate(268px, 230px) scale(1.04) translate(-268px, -230px); } }
        @media (prefers-reduced-motion: reduce) { .radial-hub__sector { transition: none; } }
      `}</style>
    </section>
  )
}

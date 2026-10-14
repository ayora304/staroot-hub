import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'framer-motion'
import type { MotionStyle } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
const INNER_RADIUS = 82 * 0.85
const OUTER_RADIUS = 180
const SLOT_ANGLE = 45
const SLOT_ZERO_ANGLE = -112.5
const MAX_ITEMS = 8
const ICON_TILT_DEGREES = -25
const ICON_BASE_CENTER = polar((INNER_RADIUS + OUTER_RADIUS) / 2 + 22, SLOT_ZERO_ANGLE)

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
  outerCornerRadius = cornerRadius,
): string {
  const start = startAngle + gapDeg / 2
  const end = endAngle - gapDeg / 2
  const sweep = end - start
  const largeArc = sweep > 180 ? 1 : 0
  const innerRadius = Math.max(0, Math.min(cornerRadius, (rOuter - rInner) / 2))
  const outerRadius = Math.max(0, Math.min(outerCornerRadius, (rOuter - rInner) / 2))
  const outerInset = (outerRadius / Math.max(rOuter, 1) * 180) / Math.PI
  const innerInset = (innerRadius / Math.max(rInner, 1) * 180) / Math.PI
  const pointAt = (r: number, a: number) => {
    const radians = (a * Math.PI) / 180
    return { x: cx + r * Math.cos(radians), y: cy + r * Math.sin(radians) }
  }
  const outerStart = pointAt(rOuter, start + outerInset)
  const outerEnd = pointAt(rOuter, end - outerInset)
  const innerEnd = pointAt(rInner, end - innerInset)
  const innerStart = pointAt(rInner, start + innerInset)
  const outerSideEnd = pointAt(rOuter - outerRadius, end)
  const innerSideEnd = pointAt(rInner + innerRadius, end)
  const innerSideStart = pointAt(rInner + innerRadius, start)
  const outerSideStart = pointAt(rOuter - outerRadius, start)
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `Q ${pointAt(rOuter, end).x} ${pointAt(rOuter, end).y} ${outerSideEnd.x} ${outerSideEnd.y}`,
    `L ${innerSideEnd.x} ${innerSideEnd.y}`,
    `Q ${pointAt(rInner, end).x} ${pointAt(rInner, end).y} ${innerEnd.x} ${innerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    `Q ${pointAt(rInner, start).x} ${pointAt(rInner, start).y} ${innerSideStart.x} ${innerSideStart.y}`,
    `L ${outerSideStart.x} ${outerSideStart.y}`,
    `Q ${pointAt(rOuter, start).x} ${pointAt(rOuter, start).y} ${outerStart.x} ${outerStart.y}`,
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
  const iconOpacity = useTransform(activeProgress, (value) => 0.75 + 0.25 * value)
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
        <motion.g
          className="radial-hub__icon"
          style={{
            rotate: rotation,
            opacity: iconOpacity,
            transformBox: 'view-box',
            transformOrigin: `${CX}px ${CY}px`,
          } as MotionStyle}
          aria-hidden="true"
        >
          <g transform={`rotate(${ICON_TILT_DEGREES} ${ICON_BASE_CENTER.x} ${ICON_BASE_CENTER.y})`}>
            <Icon x={ICON_BASE_CENTER.x - 19} y={ICON_BASE_CENTER.y - 19} width="38" height="38" strokeWidth={1.75} />
          </g>
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
  const [hasDragged, setHasDragged] = useState(false)
  const [showSwipeHint, setShowSwipeHint] = useState(false)
  const activeIndexRef = useRef(initialIndex)
  const optionRefs = useRef<Array<SVGGElement | null>>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const wheelRef = useRef<SVGGElement>(null)
  const dragRef = useRef<{ pointerId: number; angle: number; startX: number; startY: number; lastTime: number; velocity: number; dragged: boolean } | null>(null)
  const suppressClickRef = useRef(false)
  const wedgeInnerRadius = INNER_RADIUS + 9
  const wedgeBaseOuterRadius = OUTER_RADIUS - 9
  const wedgeThickness = wedgeBaseOuterRadius - wedgeInnerRadius
  const wedgeOuterRadius = wedgeBaseOuterRadius + wedgeThickness * 0.15
  const wedgeGapUnits = 11 * 0.85 * 0.5
  const sectorPath = describeSector(CX, CY, wedgeInnerRadius, wedgeOuterRadius, -135, -90, wedgeGapUnits / wedgeOuterRadius * 180 / Math.PI, 9, 18)

  const setSettledActive = useCallback((next: number) => {
    const normalized = modulo(next, items.length)
    if (normalized === activeIndexRef.current) return
    activeIndexRef.current = normalized
    setActiveIndex(normalized)
  }, [items.length])

  const snapTo = useCallback((target: number) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(8)
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

  useEffect(() => {
    try {
      if (localStorage.getItem('staroot-radial-swipe-hint-seen')) return
      localStorage.setItem('staroot-radial-swipe-hint-seen', '1')
    } catch {
      // Keep the first-use hint available when storage is disabled.
    }
    setShowSwipeHint(true)
  }, [])

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
    if (!drag.dragged) {
      setHasDragged(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    }
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
          viewBox="0 0 560 514"
          preserveAspectRatio="xMidYMid meet"
          role="group"
          aria-label="Staroot Hub sections"
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <g ref={wheelRef} className="radial-hub__wheel" transform={`translate(-23 20) translate(${CX} ${CY}) scale(1.296) translate(${-CX} ${-CY})`}>
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
          <foreignObject x="18" y="215" width="340" height="260" className="radial-hub__active-panel">
            <div className="radial-hub__active-inner" aria-live="polite" aria-atomic="true">
              <div key={activeItem.id} className="radial-hub__active-copy">
                  <div className="radial-hub__pager" aria-label={`Module ${activeIndex + 1} of ${items.length}`} role="img">
                    {items.map((item, index) => <span key={item.id} className={index === activeIndex ? 'is-active' : undefined} />)}
                  </div>
                  <h2>{activeItem.label}</h2>
                  <p className="radial-hub__description">{activeItem.description}</p>
                  <button type="button" className="radial-hub__open" onClick={() => navigate(activeItem.to)}>
                    <span>Open</span><ChevronRight aria-hidden="true" size={15} />
                  </button>
              </div>
            </div>
          </foreignObject>
        </svg>
      </div>
      <div className="radial-hub__controls" aria-label="Module controls">
        <button type="button" aria-label="Previous module" onClick={() => rollTo(modulo(activeIndex - 1, items.length), true)}><ChevronLeft aria-hidden="true" /></button>
        {!hasDragged && <motion.p
          animate={showSwipeHint && !reduceMotion ? { x: [0, 7, 0] } : { x: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >Drag around the ring, or tap a segment</motion.p>}
        <button type="button" aria-label="Next module" onClick={() => rollTo(modulo(activeIndex + 1, items.length), true)}><ChevronRight aria-hidden="true" /></button>
      </div>
      <style>{`
        .radial-hub { color: var(--c-text); }
        .radial-hub { --rh-base: #2A261D; --rh-gold: #E8B02E; --rh-gold-ink: #412402; --rh-badge: #E8B02E; }
        .radial-hub__frame { width: 100%; }
        .radial-hub__svg { overflow: visible; touch-action: none; }
        .radial-hub__option { cursor: pointer; outline: none; }
        .radial-hub__sector { fill: color-mix(in srgb, var(--rh-gold) var(--active-progress, 0%), var(--rh-base)); stroke: color-mix(in srgb, var(--rh-gold) var(--active-progress, 0%), var(--rh-base)); stroke-width: 12px; stroke-linejoin: round; transition: filter 150ms ease; }
        .radial-hub__option:hover .radial-hub__sector { filter: brightness(1.12); }
        .radial-hub__option:focus-visible .radial-hub__sector { stroke: var(--c-text); stroke-width: 4; }
        .radial-hub__icon { color: color-mix(in srgb, var(--rh-gold-ink) var(--active-progress, 0%), #E5E5E5); pointer-events: none; }
        .radial-hub__wheel { transform-box: view-box; translate: -10px 25px; }
        .radial-hub__badge circle { fill: var(--rh-badge); stroke: var(--c-bg); stroke-width: 2; }
        .radial-hub__badge text { fill: var(--rh-gold-ink); font: 600 11px var(--font-sans); }
        .radial-hub__active-inner { box-sizing: border-box; width: 340px; height: 260px; display: flex; align-items: flex-start; padding-top: 8px; font-family: var(--font-sans); }
        .radial-hub__active-copy { width: 100%; }
        .radial-hub__eyebrow { margin: 0 0 6px; color: var(--rh-gold); font-size: 12px; font-weight: 500; }
        .radial-hub__active-copy h2 { margin: 0 0 7px; color: var(--c-text); font-size: 36.4px; font-weight: 500; line-height: 1.1; overflow-wrap: anywhere; }
        .radial-hub__description { margin: 0 0 12px; color: var(--c-muted); font-size: 25.2px; line-height: 1.5; }
        .radial-hub__open { min-height: 44px; max-width: 100%; display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--rh-gold); border-radius: 10px; padding: 0 14px; background: var(--rh-gold); color: var(--rh-gold-ink); font: 600 18.72px var(--font-sans); cursor: pointer; }
        .radial-hub__open:hover, .radial-hub__open:focus-visible { background: var(--rh-gold); border-color: var(--rh-gold); color: var(--rh-gold-ink); }
        .radial-hub__open:focus-visible, .radial-hub__controls button:focus-visible { outline: 3px solid var(--rh-gold); outline-offset: 2px; }
        .radial-hub__center-content { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; text-align: center; }
        .radial-hub__pager { display: flex; align-items: center; gap: 5px; min-height: 12px; margin: 0 0 8px; }
        .radial-hub__pager span { width: 6px; height: 6px; border-radius: 999px; background: color-mix(in srgb, var(--c-text) 38%, transparent); transition: width 180ms ease, background-color 180ms ease; }
        .radial-hub__pager span.is-active { width: 18px; background: var(--rh-gold); }
        .radial-hub__controls { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 16px 8px 0; }
        .radial-hub__controls button { width: 44px; height: 44px; flex: 0 0 44px; display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid var(--c-border); border-radius: 12px; padding: 0; background: transparent; color: var(--c-text); cursor: pointer; }
        .radial-hub__controls button svg { width: 22px; height: 22px; stroke-width: 1.75; }
        .radial-hub__controls p { position: relative; top: 55px; flex: 1; margin: 0; color: var(--c-muted); text-align: center; font-size: 14px; line-height: 1.35; }
        @media (hover: none) { .radial-hub__controls button { display: none; } .radial-hub__controls { justify-content: center; } }
        @media (hover: hover) and (pointer: fine) { .radial-hub__controls { margin-top: 90px; } }
        @media (min-width: 600px) { .radial-hub__wheel { transform: translate(42px, 20px) translate(268px, 230px) scale(0.936) translate(-268px, -230px); } }
        @media (prefers-reduced-motion: reduce) { .radial-hub__sector, .radial-hub__pager span { transition: none; } }
      `}</style>
    </section>
  )
}

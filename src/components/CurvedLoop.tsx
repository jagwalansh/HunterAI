import { type FC, type PointerEvent, useEffect, useId, useMemo, useRef, useState } from 'react'

interface CurvedLoopProps {
  marqueeText?: string
  speed?: number
  className?: string
  curveAmount?: number
  direction?: 'left' | 'right'
  interactive?: boolean
}

const CurvedLoop: FC<CurvedLoopProps> = ({
  marqueeText = '',
  speed = 2,
  className,
  curveAmount = 400,
  direction = 'left',
  interactive = true,
}) => {
  const text = useMemo(() => {
    const hasTrailing = /\s|\u00A0$/.test(marqueeText)
    return (hasTrailing ? marqueeText.replace(/\s+$/, '') : marqueeText) + '\u00A0'
  }, [marqueeText])

  const measureRef = useRef<SVGTextElement | null>(null)
  const textPathRef = useRef<SVGTextPathElement | null>(null)
  const [spacing, setSpacing] = useState(0)
  const [offset, setOffset] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const uid = useId()
  const pathId = `curve-${uid}`
  const pathD = `M-100,40 Q500,${40 + curveAmount} 1540,40`

  const dragRef = useRef(false)
  const lastXRef = useRef(0)
  const dirRef = useRef<'left' | 'right'>(direction)
  const velRef = useRef(0)

  const totalText = spacing ? Array(Math.ceil(3600 / spacing) + 4).fill(text).join('') : text
  const ready = spacing > 0

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReduceMotion(media.matches)
    updatePreference()
    media.addEventListener('change', updatePreference)
    return () => media.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const updateSpacing = () => {
      if (measureRef.current) setSpacing(measureRef.current.getComputedTextLength())
    }

    updateSpacing()
    document.fonts?.ready.then(updateSpacing).catch(() => undefined)
  }, [text, className])

  useEffect(() => {
    dirRef.current = direction
  }, [direction])

  useEffect(() => {
    if (!spacing || !textPathRef.current) return
    const initial = -spacing
    textPathRef.current.setAttribute('startOffset', `${initial}px`)
    setOffset(initial)
  }, [spacing])

  useEffect(() => {
    if (!spacing || !ready || reduceMotion) return
    let frame = 0
    const step = () => {
      if (!dragRef.current && textPathRef.current) {
        const delta = dirRef.current === 'right' ? speed : -speed
        const currentOffset = parseFloat(textPathRef.current.getAttribute('startOffset') || '0')
        let newOffset = currentOffset + delta
        if (newOffset <= -spacing) newOffset += spacing
        if (newOffset > 0) newOffset -= spacing
        textPathRef.current.setAttribute('startOffset', `${newOffset}px`)
        setOffset(newOffset)
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [spacing, speed, ready, reduceMotion])

  const onPointerDown = (event: PointerEvent) => {
    if (!interactive) return
    dragRef.current = true
    lastXRef.current = event.clientX
    velRef.current = 0
    ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!interactive || !dragRef.current || !textPathRef.current) return
    const dx = event.clientX - lastXRef.current
    lastXRef.current = event.clientX
    velRef.current = dx
    const currentOffset = parseFloat(textPathRef.current.getAttribute('startOffset') || '0')
    let newOffset = currentOffset + dx
    if (newOffset <= -spacing) newOffset += spacing
    if (newOffset > 0) newOffset -= spacing
    textPathRef.current.setAttribute('startOffset', `${newOffset}px`)
    setOffset(newOffset)
  }

  const endDrag = () => {
    if (!interactive) return
    dragRef.current = false
    dirRef.current = velRef.current > 0 ? 'right' : 'left'
  }

  return (
    <div
      className="curved-loop"
      style={{ visibility: ready ? 'visible' : 'hidden', cursor: interactive ? (dragRef.current ? 'grabbing' : 'grab') : 'auto' }}
      onPointerDown={onPointerDown}
      onPointerLeave={endDrag}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
    >
      <svg className="curved-loop-svg" viewBox="0 0 1440 120">
        <text
          ref={measureRef}
          xmlSpace="preserve"
          className={className}
          style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }}
        >
          {text}
        </text>
        <defs>
          <path id={pathId} d={pathD} fill="none" stroke="transparent" />
        </defs>
        {ready && (
          <text xmlSpace="preserve" className={className}>
            <textPath ref={textPathRef} href={`#${pathId}`} startOffset={`${offset}px`} xmlSpace="preserve">
              {totalText}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  )
}

export default CurvedLoop

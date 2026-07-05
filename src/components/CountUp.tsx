import { useEffect, useMemo, useState } from 'react'

interface CountUpProps {
  to: number
  from?: number
  direction?: 'up' | 'down'
  delay?: number
  duration?: number
  className?: string
  startWhen?: boolean
  separator?: string
  shuffle?: boolean
  shuffleDuration?: number
  onStart?: () => void
  onEnd?: () => void
}

type LayoutEntry =
  | { type: 'digit'; fromDigit: number; toDigit: number }
  | { type: 'separator'; value: string }

function getDecimalPlaces(num: number) {
  const value = num.toString()
  if (!value.includes('.')) return 0
  const decimals = value.split('.')[1]
  return parseInt(decimals) === 0 ? 0 : decimals.length
}

function formatNumber(value: number, decimals: number, separator: string) {
  const formatted = Intl.NumberFormat('en-US', {
    useGrouping: Boolean(separator),
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)

  return separator ? formatted.replace(/,/g, separator) : formatted
}

function buildLayout(from: number, to: number, decimals: number, separator: string): LayoutEntry[] {
  const fromValue = decimals > 0 ? Math.abs(from).toFixed(decimals) : Math.round(Math.abs(from)).toString()
  const toValue = decimals > 0 ? Math.abs(to).toFixed(decimals) : Math.round(Math.abs(to)).toString()
  const [fromInt, fromDecimal = ''] = fromValue.split('.')
  const [toInt, toDecimal = ''] = toValue.split('.')
  const intLength = Math.max(fromInt.length, toInt.length)
  const fromPadded = fromInt.padStart(intLength, '0')
  const toPadded = toInt.padStart(intLength, '0')
  const entries: LayoutEntry[] = []

  if (separator) {
    const template = toPadded.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    let digitIndex = 0

    for (const char of template) {
      if (char === separator) {
        entries.push({ type: 'separator', value: separator })
      } else {
        entries.push({
          type: 'digit',
          fromDigit: Number(fromPadded[digitIndex]),
          toDigit: Number(toPadded[digitIndex]),
        })
        digitIndex += 1
      }
    }
  } else {
    for (let index = 0; index < intLength; index += 1) {
      entries.push({
        type: 'digit',
        fromDigit: Number(fromPadded[index]),
        toDigit: Number(toPadded[index]),
      })
    }
  }

  if (decimals > 0) {
    entries.push({ type: 'separator', value: '.' })
    for (let index = 0; index < decimals; index += 1) {
      entries.push({
        type: 'digit',
        fromDigit: Number(fromDecimal[index] ?? 0),
        toDigit: Number(toDecimal[index] ?? 0),
      })
    }
  }

  return entries
}

function buildDigitSequence(fromDigit: number, toDigit: number, countingUp: boolean, cycles: number) {
  const sequence = [fromDigit]
  let current = fromDigit

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    for (let step = 0; step < 10; step += 1) {
      current = countingUp ? (current + 1) % 10 : (current + 9) % 10
      sequence.push(current)
    }
  }

  while (current !== toDigit) {
    current = countingUp ? (current + 1) % 10 : (current + 9) % 10
    sequence.push(current)
  }

  return sequence
}

function OdometerDigit({
  sequence,
  rolling,
  duration,
  delay,
}: {
  sequence: number[]
  rolling: boolean
  duration: number
  delay: number
}) {
  const finalOffset = `-${sequence.length - 1}em`

  return (
    <span className="odometer-digit" aria-hidden="true">
      <span
        className="odometer-strip"
        style={{
          transform: rolling ? `translateY(${finalOffset})` : 'translateY(0)',
          transition: rolling ? `transform ${duration}s cubic-bezier(0, 0, 0.2, 1) ${delay}s` : 'none',
        }}
      >
        {sequence.map((digit, index) => (
          <span className="odometer-number" key={`${digit}-${index}`}>
            {digit}
          </span>
        ))}
      </span>
    </span>
  )
}

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 1.4,
  className = '',
  startWhen = true,
  separator = '',
  shuffle = false,
  shuffleDuration = 0.75,
  onStart,
  onEnd,
}: CountUpProps) {
  const [rolling, setRolling] = useState(false)
  const startValue = direction === 'down' ? to : from
  const endValue = direction === 'down' ? from : to
  const countingUp = endValue >= startValue
  const decimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to))
  const formattedFinal = useMemo(() => formatNumber(endValue, decimals, separator), [endValue, decimals, separator])

  const layout = useMemo(
    () => buildLayout(startValue, endValue, decimals, separator),
    [startValue, endValue, decimals, separator],
  )

  const entries = useMemo(() => {
    let digitIndex = 0

    return layout.map((entry) => {
      if (entry.type === 'separator') return entry
      const cycles = shuffle ? 2 + (digitIndex % 2) : 0
      digitIndex += 1

      return {
        ...entry,
        sequence: buildDigitSequence(entry.fromDigit, entry.toDigit, countingUp, cycles),
      }
    })
  }, [layout, countingUp, shuffle])

  useEffect(() => {
    setRolling(false)
  }, [from, to, direction, separator])

  useEffect(() => {
    if (!startWhen) return

    const startTimeout = window.setTimeout(() => {
      onStart?.()
      setRolling(true)
    }, delay * 1000)

    const endTimeout = window.setTimeout(() => {
      onEnd?.()
    }, (delay + duration + (shuffle ? shuffleDuration * 0.15 : 0)) * 1000)

    return () => {
      window.clearTimeout(startTimeout)
      window.clearTimeout(endTimeout)
    }
  }, [startWhen, delay, duration, shuffle, shuffleDuration, onStart, onEnd])

  let digitIndex = 0

  return (
    <span className={`odometer-counter ${className}`} aria-label={formattedFinal}>
      {entries.map((entry, index) => {
        if (entry.type === 'separator') {
          return (
            <span className="odometer-separator" aria-hidden="true" key={`${entry.value}-${index}`}>
              {entry.value}
            </span>
          )
        }

        const wheelDelay = digitIndex * 0.045
        digitIndex += 1

        return (
          <OdometerDigit
            delay={wheelDelay}
            duration={duration}
            key={`digit-${index}`}
            rolling={rolling}
            sequence={entry.sequence}
          />
        )
      })}
    </span>
  )
}

import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { useFinePointer, useReducedMotion } from '@/hooks/useMediaQuery'

type Props = {
  children: ReactNode
  /** Quanto o elemento acompanha o cursor (0–1). */
  strength?: number
  className?: string
}

/**
 * O elemento "puxa" o cursor quando ele chega perto.
 *
 * Só liga em ponteiro fino: no touch não existe hover, e no celular o efeito
 * viraria um salto estranho no momento do toque.
 */
export function Magnetic({ children, strength = 0.35, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || !fine || reduced) return

    const move = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
    const moveY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      move((e.clientX - (rect.left + rect.width / 2)) * strength)
      moveY((e.clientY - (rect.top + rect.height / 2)) * strength)
    }
    const onLeave = () => {
      move(0)
      moveY(0)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      gsap.set(el, { x: 0, y: 0 })
    }
  }, [strength, fine, reduced])

  return (
    <span ref={ref} className={className} style={{ display: 'inline-block', willChange: 'transform' }}>
      {children}
    </span>
  )
}

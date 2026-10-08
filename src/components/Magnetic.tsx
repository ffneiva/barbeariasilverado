import { useEffect, useRef, type ReactNode } from 'react'
import { useFinePointer, useReducedMotion } from '@/hooks/useMediaQuery'

/**
 * O elemento "puxa" o cursor quando ele chega perto.
 *
 * Só liga em ponteiro fino: no touch não existe hover, e no celular o efeito
 * viraria um salto estranho no momento do toque.
 *
 * Sem GSAP, pelo mesmo motivo do Cursor — era interpolação amortecida e nada
 * mais. O laço dorme quando o elemento chega no lugar e acorda no próximo
 * movimento, então não fica consumindo bateria com o mouse parado.
 */

const VELOCIDADE = 0.18

type Props = {
  children: ReactNode
  /** Quanto o elemento acompanha o cursor (0–1). */
  strength?: number
  className?: string
}

export function Magnetic({ children, strength = 0.35, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || !fine || reduced) return

    const alvo = { x: 0, y: 0 }
    const atual = { x: 0, y: 0 }
    let frame = 0
    let rodando = false
    let ultimo = 0

    const laco = (agora: number) => {
      const delta = Math.min(0.064, (agora - ultimo) / 1000)
      ultimo = agora

      const k = 1 - Math.pow(1 - VELOCIDADE, delta * 60)
      atual.x += (alvo.x - atual.x) * k
      atual.y += (alvo.y - atual.y) * k
      el.style.transform = `translate3d(${atual.x.toFixed(2)}px, ${atual.y.toFixed(2)}px, 0)`

      if (Math.abs(alvo.x - atual.x) < 0.1 && Math.abs(alvo.y - atual.y) < 0.1) {
        el.style.transform = `translate3d(${alvo.x}px, ${alvo.y}px, 0)`
        rodando = false
        return
      }
      frame = requestAnimationFrame(laco)
    }

    const acordar = () => {
      if (rodando) return
      rodando = true
      ultimo = performance.now()
      frame = requestAnimationFrame(laco)
    }

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      alvo.x = (e.clientX - (rect.left + rect.width / 2)) * strength
      alvo.y = (e.clientY - (rect.top + rect.height / 2)) * strength
      acordar()
    }

    const onLeave = () => {
      alvo.x = 0
      alvo.y = 0
      acordar()
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      el.style.transform = ''
    }
  }, [strength, fine, reduced])

  return (
    <span ref={ref} className={className} style={{ display: 'inline-block', willChange: 'transform' }}>
      {children}
    </span>
  )
}
